// Supabase Edge Function: skjermbilde — tar imot et skjermbilde fra Snarveier-appen på iPad (Kontrollsenter-knappen
// «Lag oppfølging») og legger det i innboksen: fil i bucket cardimg (<uid>/innboks-<id>.jpg) + rad i oppf_innboks.
// Appen henter bildet selv i det den åpnes (snarveien åpner den), kjører samme AI-analyse som LIM INN og rydder opp.
//
// Deployes med verify_jwt=false: identiteten kommer fra selgerens EGEN nøkkel i hodet «x-oppf-nokkel». Nøkkelen lages i
// appen (Min profil → Snarvei «Lag oppfølging»), bare sha256-hashen ligger i tabellen oppf_snarvei_nokkel.
// Kropp: rå bildebytes (Content-Type image/jpeg|png) ELLER multipart/form-data med én fil. Maks 8 MB.
// Hodet «x-oppf-varm» = ping fra pg_cron (supabase/sql/2026-10-20-snarvei-varm.sql) som holder funksjonen varm.
// v2 (20.10.2026): nøkkeloppslag og lesing av kroppen går parallelt, bremse-telling og opplasting parallelt,
// last_used_at oppdateres etter at svaret er sendt → ca. halvert svartid.
// SQL: supabase/sql/2026-10-18-snarvei.sql. SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY injiseres automatisk av Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2'

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const BUCKET = 'cardimg'
const MAKS_BYTES = 8 * 1024 * 1024
const MAKS_PR_10MIN = 30

const json = (o: unknown, status = 200) => Response.json(o, { status })

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Snarveier setter ikke alltid riktig Content-Type → se på de første bytene
function sniff(b: Uint8Array): string {
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return 'image/webp'
  return ''
}

async function lesBilde(req: Request): Promise<{ bytes: Uint8Array; type: string }> {
  const ct = (req.headers.get('content-type') || '').toLowerCase()
  if (ct.startsWith('multipart/form-data')) {
    const fd = await req.formData()
    for (const v of fd.values()) {
      if (v instanceof File) return { bytes: new Uint8Array(await v.arrayBuffer()), type: (v.type || '').toLowerCase() }
    }
    return { bytes: new Uint8Array(0), type: '' }
  }
  return { bytes: new Uint8Array(await req.arrayBuffer()), type: ct.split(';')[0].trim() }
}

// kjør etter at svaret er sendt (Supabase-runtime) — ellers bare uten å vente
function etterpaa(p: Promise<unknown>) {
  const rt = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime
  if (rt?.waitUntil) rt.waitUntil(p.catch(() => {}))
  else p.catch(() => {})
}

Deno.serve(async (req) => {
  if (req.headers.get('x-oppf-varm')) return json({ ok: true, varm: true }) // ping fra pg_cron: bare hold isolatet i live
  if (req.method !== 'POST') return json({ ok: false, feil: 'bruk POST' }, 405)

  // 1) hvem sender? (nøkkel → hash → selger) — samtidig som kroppen leses
  const key = (req.headers.get('x-oppf-nokkel') || '').trim()
  if (!/^oppf_[A-Za-z0-9_-]{20,}$/.test(key)) return json({ ok: false, feil: 'mangler nøkkel (hodet x-oppf-nokkel)' }, 401)
  const hashP = sha256(key).then((h) => sb.from('oppf_snarvei_nokkel').select('user_id').eq('key_hash', h).maybeSingle())
  let bilde: { bytes: Uint8Array; type: string }
  try {
    bilde = await lesBilde(req)
  } catch (e) {
    return json({ ok: false, feil: 'kunne ikke lese forespørselen: ' + ((e as Error)?.message || e) }, 400)
  }
  const { data: nk, error: nkErr } = await hashP
  if (nkErr) return json({ ok: false, feil: 'oppslag feilet: ' + nkErr.message }, 500)
  if (!nk) return json({ ok: false, feil: 'ukjent nøkkel — lag en ny i appen under Min profil' }, 401)

  // 2) bildet
  let { bytes, type } = bilde
  if (!bytes || bytes.length < 1000) return json({ ok: false, feil: 'fant ikke noe bilde i forespørselen' }, 400)
  if (bytes.length > MAKS_BYTES) return json({ ok: false, feil: 'bildet er for stort (maks 8 MB) — krymp det i snarveien' }, 413)
  const sniffed = sniff(bytes)
  if (sniffed) type = sniffed
  if (!type.startsWith('image/')) return json({ ok: false, feil: 'dette er ikke et bilde' }, 415)

  // 3) bremse pr. selger og opplasting — parallelt (bremsen slår sjelden inn, så vi venter ikke på den først)
  const id = crypto.randomUUID()
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${nk.user_id}/innboks-${id}.${ext}`
  const siden = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const [tell, up] = await Promise.all([
    sb.from('oppf_innboks').select('id', { count: 'exact', head: true }).eq('user_id', nk.user_id).gte('created_at', siden),
    sb.storage.from(BUCKET).upload(path, new Blob([bytes], { type }), { contentType: type, upsert: false }),
  ])
  if (up.error) return json({ ok: false, feil: 'lagring feilet: ' + up.error.message }, 500)
  if ((tell.count || 0) >= MAKS_PR_10MIN) {
    etterpaa(sb.storage.from(BUCKET).remove([path]))
    return json({ ok: false, feil: 'for mange bilder på kort tid — vent litt' }, 429)
  }

  // 4) innboks-rad → appen ser den ved neste oppslag
  const ins = await sb.from('oppf_innboks').insert({ id, user_id: nk.user_id, path, bytes: bytes.length })
  if (ins.error) {
    etterpaa(sb.storage.from(BUCKET).remove([path]))
    return json({ ok: false, feil: 'innboks feilet: ' + ins.error.message }, 500)
  }
  etterpaa(sb.from('oppf_snarvei_nokkel').update({ last_used_at: new Date().toISOString() }).eq('user_id', nk.user_id))
  return json({ ok: true, id, bytes: bytes.length })
})
