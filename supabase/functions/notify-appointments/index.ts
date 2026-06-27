// Supabase Edge Function: sender push-varsel ~5 min før en avtale.
// Kalles hvert minutt av pg_cron. Hemmeligheter hentes fra Edge-secrets (aldri i koden).
//
// Secrets som må settes i Supabase (Project Settings → Edge Functions → Secrets):
//   VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT (valgfri), CRON_SECRET
// SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY injiseres automatisk av Supabase.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:christian.rasch@snodriv.no'
const CRON_SECRET   = Deno.env.get('CRON_SECRET') || ''

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
const sb = createClient(SUPABASE_URL, SERVICE_ROLE)

// Oslo veggtid-offset (ms) ved et gitt tidspunkt — håndterer sommer-/vintertid
function osloOffsetMs(at: Date): number {
  const oslo = new Date(at.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }))
  const utc  = new Date(at.toLocaleString('en-US', { timeZone: 'UTC' }))
  return oslo.getTime() - utc.getTime()
}
// tolk "YYYY-MM-DDTHH:MM" (Oslo veggtid) som UTC-instant
function apptInstant(s: string, offMs: number): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s)
  if (!m) return null
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0) - offMs
}

async function subsFor(userId: string) {
  const { data } = await sb.from('push_subscriptions')
    .select('endpoint,sub').eq('user_id', userId).eq('enabled', true)
  return data || []
}
async function sendTo(userId: string, payload: unknown) {
  const subs = await subsFor(userId)
  for (const r of subs) {
    try { await webpush.sendNotification(r.sub, JSON.stringify(payload)) }
    catch (e: any) {
      const code = e?.statusCode
      if (code === 404 || code === 410) // utløpt påmelding → deaktiver
        await sb.from('push_subscriptions').update({ enabled: false }).eq('endpoint', r.endpoint)
    }
  }
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET)
    return new Response('forbidden', { status: 403 })

  let body: any = {}
  try { body = await req.json() } catch { /* tom body er ok */ }

  // TEST: send et varsel til alle påmeldte enheter med en gang
  if (body.test) {
    const { data } = await sb.from('push_subscriptions').select('user_id').eq('enabled', true)
    const ids = [...new Set((data || []).map((r: any) => r.user_id))]
    for (const id of ids) await sendTo(id, { title: 'Test-varsel ✓', body: 'Varsler fungerer.', url: './' })
    return Response.json({ ok: true, test: true, users: ids.length })
  }

  const now = new Date()
  const off = osloOffsetMs(now)

  // rydd gamle dedupe-rader (eldre enn 1 dag)
  await sb.from('notif_sent').delete().lt('sent_at', new Date(now.getTime() - 864e5).toISOString())

  const { data: snaps } = await sb.from('oppf_snapshots').select('user_id,data')
  let sent = 0
  for (const row of snaps || []) {
    const items = Array.isArray(row.data) ? row.data : []
    for (const it of items) {
      if (!it || it.state === 'fulgt' || typeof it.dato !== 'string') continue
      const inst = apptInstant(it.dato, off)
      if (inst == null) continue
      const mins = (inst - now.getTime()) / 60000
      if (mins < 4 || mins > 6) continue // ~5 min før (4–6 min vindu for cron-jitter)
      // dedupe: kun én gang pr (bruker, kort, tidspunkt)
      const ins = await sb.from('notif_sent')
        .upsert({ user_id: row.user_id, item_id: String(it.id), dato: it.dato },
                { onConflict: 'user_id,item_id,dato', ignoreDuplicates: true }).select()
      if (!ins.data || !ins.data.length) continue // allerede sendt
      const navn = (it.navn || '').trim()
      const tid = it.dato.slice(11, 16)
      await sendTo(row.user_id, {
        title: 'Avtale om 5 min' + (navn ? ' — ' + navn : ''),
        body: (navn ? navn + ' • ' : '') + 'kl. ' + tid + (it.adresse ? ' • ' + it.adresse : ''),
        tag: 'appt-' + it.id, url: './'
      })
      sent++
    }
  }
  return Response.json({ ok: true, sent })
})
