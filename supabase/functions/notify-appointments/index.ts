// Supabase Edge Function: push-varsler.
//  1) X min før hver avtale — X er selgerens standard (kolonnen oppf_snapshots.varsler.min, default 5) eller kortets egen
//     overstyring (feltet varsel.min på kortet). Valgfritt ekstra varsel (varsler.ekstra / ekstraMin) med eget minutt-tall.
//  2) kl. 21:45 (Oslo): daglig påminnelse om dagens kort som fortsatt står «Husk å send tilbud».
//  3) dagsoversikt «Oppfølginger i dag: N» til selgerens valgte klokkeslett (varsler.dagOn / dagTid). Sendes ikke når N = 0.
//  4) «Må gjøres» fra i går: N stk — valgfritt (varsler.gjoreOn / gjoreTid): send_offer-kort satt i går som fortsatt står. Ikke når N = 0.
// Et kort med varselMute === dato er dempet fra appen → ingen flere avtale-varsler for den datoen.
// Kalles hvert minutt av pg_cron. Hemmeligheter hentes fra Edge-secrets (aldri i koden).
// Test fra terminalen (body): {test:true} = test-varsel, {test:'offers'} = tilbud-påminnelse nå, {test:'daily'} = dagsoversikt nå, {test:'gjore'} = «Må gjøres fra i går» nå.
// Logg: hver leveranse (ok/feil) skrives til notif_log, og hver kjøring oppdaterer notif_status (hjerteslag)
// — se supabase/sql/2026-09-10-drift.sql. Dedupe-raden i notif_sent skrives først når det finnes en aktiv enhet å sende til.
//
// Secrets (Project Settings → Edge Functions → Secrets):
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

function osloOffsetMs(at: Date): number {
  const p = osloNums(at)
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return asUtc - at.getTime()
}
function apptInstant(s: string, offMs: number): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s)
  if (!m) return null
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0) - offMs
}

// Oslo-veggtid: dato (YYYY-MM-DD) + minutter siden midnatt
const OSLO_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
})
function osloNums(at: Date): Record<string, string> {
  const p: Record<string, string> = {}
  for (const x of OSLO_FMT.formatToParts(at)) p[x.type] = x.value
  return p
}
function osloParts(at: Date) {
  const p = osloNums(at)
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: (+p.hour) * 60 + (+p.minute) }
}
function osloDate(v: number | string): string { return osloParts(new Date(v)).date }

async function subsFor(userId: string) {
  const { data } = await sb.from('push_subscriptions')
    .select('endpoint,sub').eq('user_id', userId).eq('enabled', true)
  return data || []
}
// sender til alle aktive enheter for brukeren og logger hver leveranse; returnerer antall ok/feil
async function sendTo(userId: string, payload: unknown, kind = 'other', itemId = '', subs?: any[]) {
  const list = subs ?? await subsFor(userId)
  let ok = 0, fail = 0
  for (const r of list) {
    let status = 0, err = ''
    try { const res: any = await webpush.sendNotification(r.sub, JSON.stringify(payload)); status = res?.statusCode ?? 201; ok++ }
    catch (e: any) {
      status = e?.statusCode ?? 0; err = String(e?.body || e?.message || e).slice(0, 300); fail++
      console.error('push feilet', kind, userId, status, err)
      if (status === 404 || status === 410)
        await sb.from('push_subscriptions').update({ enabled: false }).eq('endpoint', r.endpoint)
    }
    try {
      await sb.from('notif_log').insert({ user_id: userId, kind, item_id: itemId || null, endpoint: String(r.endpoint || '').slice(0, 120), status, ok: !err, err: err || null })
    } catch (_) { /* logg-tabellen mangler → varsler går uansett */ }
  }
  return { ok, fail }
}
// hjerteslag: én rad (id=1) som viser når jobben sist kjørte og siste feil
async function heartbeat(patch: Record<string, unknown>) {
  try { await sb.from('notif_status').upsert({ id: 1, ...patch }, { onConflict: 'id' }) } catch (_) {}
}

// ---- varsel-innstillinger (se supabase/sql/2026-10-28-varsler.sql) ----
// heltall 0–999, ellers reserveverdien
function num(v: unknown, d: number): number {
  if (v === null || v === undefined || v === '' || !Number.isFinite(+(v as any))) return d
  return Math.max(0, Math.min(999, Math.round(+(v as any))))
}
function obj(v: unknown): Record<string, any> { return (v && typeof v === 'object' && !Array.isArray(v)) ? v as Record<string, any> : {} }
// gjeldende varsel for ett kort: kortets egen overstyring (it.varsel) foran selgerens standard (row.varsler) foran 5 / av / 15
function varselFor(it: any, def: Record<string, any>) {
  const ov = obj(it.varsel)
  return {
    min: num(ov.min, num(def.min, 5)),
    ekstra: typeof ov.ekstra === 'boolean' ? ov.ekstra : !!def.ekstra,
    ekstraMin: num(ov.ekstraMin, num(def.ekstraMin, 15)),
  }
}
// alle selgere (user_id, data, varsler); faller tilbake uten varsler-kolonnen hvis SQL-en ikke er kjørt ennå
async function loadSnaps(): Promise<any[]> {
  let q: any = await sb.from('oppf_snapshots').select('user_id,data,varsler')
  if (q.error && /varsler|column|schema cache/i.test(q.error.message || '')) q = await sb.from('oppf_snapshots').select('user_id,data')
  if (q.error) throw q.error
  return q.data || []
}
// dagens kort: aktive med dato i dag (også de som alt er passert), sortert på klokkeslett
function dueToday(items: any[], today: string): any[] {
  return items.filter((it: any) => it && it.state !== 'fulgt' && typeof it.dato === 'string' && it.dato.slice(0, 10) === today)
    .sort((a: any, b: any) => a.dato < b.dato ? -1 : a.dato > b.dato ? 1 : 0)
}
function dailyPayload(due: any[], tag: string) {
  const n = due.length
  const lines = due.slice(0, 4).map((d: any) => d.dato.slice(11, 16) + ' ' + ((d.navn || '').trim() || (d.adresse || '').trim() || '—'))
  if (n > 4) lines.push('+ ' + (n - 4) + ' til')
  return { title: 'Oppfølginger i dag: ' + n, body: lines.join('\n'), tag, url: './', glow: { ids: due.map((d: any) => String(d.id)), view: 'avtaler', sub: 'alle' } }
}
// ---- «Må gjøres» fra i går ----
function osloDateSafe(v: unknown): string { const d = new Date(v as any); return Number.isFinite(d.getTime()) ? osloParts(d).date : '' } // '' ved ugyldig/manglende stempel (osloDate kaster)
function prevDate(d: string): string { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd) - 864e5).toISOString().slice(0, 10) } // kalender-dagen før (uavhengig av sommertid)
// «Må gjøres»-kort fra en gitt Oslo-dato: samme stempel som fanen i appen (offerSince, eldre kort: opprettet)
function gjoreDue(items: any[], target: string): any[] {
  return items.filter((it: any) => it && it.state !== 'fulgt' && it.nextAction === 'send_offer' && osloDateSafe(it.offerSince || it.opprettet) === target)
}
function gjorePayload(due: any[], tag: string) {
  const n = due.length
  const lines = due.slice(0, 4).map((d: any) => (d.navn || '').trim() || (d.adresse || '').trim() || '—')
  if (n > 4) lines.push('+ ' + (n - 4) + ' til')
  return { title: '«Må gjøres» fra i går: ' + n + ' stk', body: lines.join('\n'), tag, url: './', glow: { ids: due.map((d: any) => String(d.id)), view: 'gjore', gsub: 'send_offer' } }
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET)
    return new Response('forbidden', { status: 403 })
  let body: any = {}
  try { body = await req.json() } catch {}

  if (body.test === 'offers') { // test av daglig tilbud-påminnelse nå (ignorer klokkeslett + dedupe)
    const { data: snaps } = await sb.from('oppf_snapshots').select('user_id,data')
    const { date: today } = osloParts(new Date())
    let n = 0
    for (const row of snaps || []) {
      const items = Array.isArray(row.data) ? row.data : []
      const due = items.filter((it: any) =>
        it && it.state !== 'fulgt' && it.nextAction === 'send_offer' &&
        it.offerSince && osloDate(it.offerSince) === today)
      if (!due.length) continue
      await sendTo(row.user_id, { title: due.length === 1 ? '1 nytt tilbud å sende ut fra i dag' : due.length + ' nye tilbud å sende ut fra i dag', tag: 'daily-offer-test', url: './', glow: { ids: due.map((d: any) => String(d.id)), view: 'gjore', gsub: 'send_offer' } }, 'test-offers', 'daily-offer')
      n++
    }
    return Response.json({ ok: true, test: 'offers', sent: n })
  }
  if (body.test === 'daily') { // test av dagsoversikten nå (kun selgere med dagsoversikt på; ignorer klokkeslett + dedupe)
    const snaps = await loadSnaps()
    const { date: today } = osloParts(new Date())
    let n = 0
    for (const row of snaps) {
      if (!obj(row.varsler).dagOn) continue
      const due = dueToday(Array.isArray(row.data) ? row.data : [], today)
      if (!due.length) continue
      await sendTo(row.user_id, dailyPayload(due, 'daily-count-test'), 'test-daily', 'daily-count')
      n++
    }
    return Response.json({ ok: true, test: 'daily', sent: n })
  }
  if (body.test === 'gjore') { // test av «Må gjøres fra i går» nå (kun selgere som har slått den på; ignorer klokkeslett + dedupe)
    const snaps = await loadSnaps()
    const { date: today } = osloParts(new Date())
    let n = 0
    for (const row of snaps) {
      if (obj(row.varsler).gjoreOn !== true) continue
      const due = gjoreDue(Array.isArray(row.data) ? row.data : [], prevDate(today))
      if (!due.length) continue
      await sendTo(row.user_id, gjorePayload(due, 'daily-gjore-test'), 'test-gjore', 'daily-gjore')
      n++
    }
    return Response.json({ ok: true, test: 'gjore', sent: n })
  }
  if (body.test) {
    const { data } = await sb.from('push_subscriptions').select('user_id').eq('enabled', true)
    const ids = [...new Set((data || []).map((r: any) => r.user_id))]
    for (const id of ids) await sendTo(id, { title: 'Test-varsel ✓', body: 'Varsler fungerer.', url: './' }, 'test', 'test')
    return Response.json({ ok: true, test: true, users: ids.length })
  }

  const now = new Date()
  const off = osloOffsetMs(now)
  const { date: today, minutes: nowMin } = osloParts(now)
  let sent = 0, offers = 0, daily = 0, gjore = 0, failed = 0
  try {
    await sb.from('notif_sent').delete().lt('sent_at', new Date(now.getTime() - 864e5).toISOString())

    const snaps = await loadSnaps()

    // 1) avtale-varsler: X min før (selgerens standard eller kortets egen overstyring) + evt. ekstra varsel med eget minutt-tall.
    //    Dedupe-nøkkelen tar med minutt-tallet (id@30, id@5#2) → endres minuttene på et kort etter første varsel, kommer et nytt.
    for (const row of snaps) {
      try {
        const items = Array.isArray(row.data) ? row.data : []
        const def = obj(row.varsler)
        let subs: any[] | null = null
        for (const it of items) {
          if (!it || it.state === 'fulgt' || typeof it.dato !== 'string') continue
          const inst = apptInstant(it.dato, off)
          if (inst == null) continue
          if (typeof it.varselMute === 'string' && it.varselMute === it.dato) continue // dempet fra kortet → ingen flere varsler for denne datoen
          const v = varselFor(it, def)
          const plans = [{ m: v.min, key: String(it.id) + '@' + v.min, tag: 'appt-' + it.id, kind: 'appt' }]
          if (v.ekstra && v.ekstraMin !== v.min) plans.push({ m: v.ekstraMin, key: String(it.id) + '@' + v.ekstraMin + '#2', tag: 'appt2-' + it.id, kind: 'appt2' })
          for (const pl of plans) {
            const d = (inst - pl.m * 60000 - now.getTime()) / 60000 // minutter til varselet skal gå; ±1 min = tre cron-tikk (som før)
            if (d < -1 || d > 1) continue
            if (subs === null) subs = await subsFor(row.user_id)
            if (!subs.length) break                          // ingen aktiv enhet → ingen dedupe-rad (kan leveres når enheten er tilbake)
            const ins = await sb.from('notif_sent')
              .upsert({ user_id: row.user_id, item_id: pl.key, dato: it.dato },
                      { onConflict: 'user_id,item_id,dato', ignoreDuplicates: true }).select()
            if (!ins.data || !ins.data.length) continue
            const navn = (it.navn || '').trim()
            const tid = it.dato.slice(11, 16)
            const r = await sendTo(row.user_id, {
              title: (pl.m === 0 ? 'Avtale nå' : 'Avtale om ' + pl.m + ' min') + (navn ? ' — ' + navn : ''),
              body: (navn ? navn + ' • ' : '') + 'kl. ' + tid + (it.adresse ? ' • ' + it.adresse : ''),
              tag: pl.tag, url: './',
              glow: { ids: [String(it.id)], view: 'avtaler', sub: 'alle' }
            }, pl.kind, String(it.id), subs)
            sent += r.ok; failed += r.fail
          }
        }
      } catch (e: any) { console.error('avtale-varsler feilet for', row.user_id, String(e?.message || e).slice(0, 200)) } // én selger stopper ikke resten
    }

    // 2) kl. 21:45 (Oslo): tilbud der handlingen «Husk å send tilbud» ble SATT i dag (offerSince) og fortsatt står slik
    if (nowMin >= 1305 && nowMin < 1310) { // 21:45–21:49 (5 min vindu for cron-jitter; dedupe → kun én gang)
      for (const row of snaps || []) {
        const items = Array.isArray(row.data) ? row.data : []
        const due = items.filter((it: any) =>
          it && it.state !== 'fulgt' && it.nextAction === 'send_offer' &&
          it.offerSince && osloDate(it.offerSince) === today)
        if (!due.length) continue
        const subs = await subsFor(row.user_id)
        if (!subs.length) continue
        const ins = await sb.from('notif_sent')
          .upsert({ user_id: row.user_id, item_id: 'daily-offer', dato: today },
                  { onConflict: 'user_id,item_id,dato', ignoreDuplicates: true }).select()
        if (!ins.data || !ins.data.length) continue
        const n = due.length
        const r = await sendTo(row.user_id, {
          title: n === 1 ? '1 nytt tilbud å sende ut fra i dag' : n + ' nye tilbud å sende ut fra i dag',
          tag: 'daily-offer-' + today, url: './',
          glow: { ids: due.map((d: any) => String(d.id)), view: 'gjore', gsub: 'send_offer' }
        }, 'offer', 'daily-offer', subs)
        offers += r.ok; failed += r.fail
      }
    }

    // 3) dagsoversikt «Oppfølginger i dag: N» til selgerens valgte klokkeslett (varsler.dagOn + dagTid 'HH:MM'). Ikke når N = 0.
    for (const row of snaps) {
      try {
        const def = obj(row.varsler)
        const tm = /^(\d{2}):(\d{2})$/.exec(String(def.dagTid || ''))
        if (!def.dagOn || !tm) continue
        const T = (+tm[1]) * 60 + (+tm[2])
        if (nowMin < T || nowMin >= T + 5) continue            // 5 min vindu for cron-jitter; dedupe → kun én gang pr. dag
        const due = dueToday(Array.isArray(row.data) ? row.data : [], today)
        if (!due.length) continue
        const subs = await subsFor(row.user_id)
        if (!subs.length) continue
        const ins = await sb.from('notif_sent')
          .upsert({ user_id: row.user_id, item_id: 'daily-count', dato: today },
                  { onConflict: 'user_id,item_id,dato', ignoreDuplicates: true }).select()
        if (!ins.data || !ins.data.length) continue
        const r = await sendTo(row.user_id, dailyPayload(due, 'daily-count-' + today), 'daily', 'daily-count', subs)
        daily += r.ok; failed += r.fail
      } catch (e: any) { console.error('dagsoversikt feilet for', row.user_id, String(e?.message || e).slice(0, 200)) }
    }
    // 4) «Må gjøres» fra i går (valgfritt: varsler.gjoreOn + gjoreTid): send_offer-kort satt i går som fortsatt står. Ikke når N = 0.
    for (const row of snaps) {
      try {
        const def = obj(row.varsler)
        const tm = /^(\d{2}):(\d{2})$/.exec(String(def.gjoreTid || ''))
        if (def.gjoreOn !== true || !tm) continue
        const T = (+tm[1]) * 60 + (+tm[2])
        if (nowMin < T || nowMin >= T + 5) continue            // 5 min vindu for cron-jitter; dedupe → kun én gang pr. dag
        const due = gjoreDue(Array.isArray(row.data) ? row.data : [], prevDate(today))
        if (!due.length) continue
        const subs = await subsFor(row.user_id)
        if (!subs.length) continue
        const ins = await sb.from('notif_sent')
          .upsert({ user_id: row.user_id, item_id: 'daily-gjore', dato: today },
                  { onConflict: 'user_id,item_id,dato', ignoreDuplicates: true }).select()
        if (!ins.data || !ins.data.length) continue
        const r = await sendTo(row.user_id, gjorePayload(due, 'daily-gjore-' + today), 'gjore', 'daily-gjore', subs)
        gjore += r.ok; failed += r.fail
      } catch (e: any) { console.error('må-gjøres-varsel feilet for', row.user_id, String(e?.message || e).slice(0, 200)) }
    }
    await heartbeat({ last_run: now.toISOString(), last_sent: sent + offers + daily + gjore, last_failed: failed })
  } catch (e: any) {
    const msg = String(e?.message || e).slice(0, 500)
    console.error('notify-appointments feilet:', msg)
    await heartbeat({ last_run: now.toISOString(), last_error: msg, last_error_at: now.toISOString() })
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }

  return Response.json({ ok: true, sent, offers, daily, gjore, failed })
})
