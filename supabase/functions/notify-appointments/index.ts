// Supabase Edge Function: push-varsler.
//  1) ~5 min før hver avtale.
//  2) kl. 21:45 (Oslo): daglig påminnelse om dagens kort som fortsatt står «Husk å send tilbud».
// Kalles hvert minutt av pg_cron. Hemmeligheter hentes fra Edge-secrets (aldri i koden).
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
  if (body.test) {
    const { data } = await sb.from('push_subscriptions').select('user_id').eq('enabled', true)
    const ids = [...new Set((data || []).map((r: any) => r.user_id))]
    for (const id of ids) await sendTo(id, { title: 'Test-varsel ✓', body: 'Varsler fungerer.', url: './' }, 'test', 'test')
    return Response.json({ ok: true, test: true, users: ids.length })
  }

  const now = new Date()
  const off = osloOffsetMs(now)
  const { date: today, minutes: nowMin } = osloParts(now)
  let sent = 0, offers = 0, failed = 0
  try {
    await sb.from('notif_sent').delete().lt('sent_at', new Date(now.getTime() - 864e5).toISOString())

    const { data: snaps, error: snapErr } = await sb.from('oppf_snapshots').select('user_id,data')
    if (snapErr) throw snapErr

    // 1) avtale-varsler ~5 min før
    for (const row of snaps || []) {
      const items = Array.isArray(row.data) ? row.data : []
      let subs: any[] | null = null
      for (const it of items) {
        if (!it || it.state === 'fulgt' || typeof it.dato !== 'string') continue
        const inst = apptInstant(it.dato, off)
        if (inst == null) continue
        const mins = (inst - now.getTime()) / 60000
        if (mins < 4 || mins > 6) continue
        if (subs === null) subs = await subsFor(row.user_id)
        if (!subs.length) continue                       // ingen aktiv enhet → ingen dedupe-rad (kan leveres når enheten er tilbake)
        const ins = await sb.from('notif_sent')
          .upsert({ user_id: row.user_id, item_id: String(it.id), dato: it.dato },
                  { onConflict: 'user_id,item_id,dato', ignoreDuplicates: true }).select()
        if (!ins.data || !ins.data.length) continue
        const navn = (it.navn || '').trim()
        const tid = it.dato.slice(11, 16)
        const r = await sendTo(row.user_id, {
          title: 'Avtale om 5 min' + (navn ? ' — ' + navn : ''),
          body: (navn ? navn + ' • ' : '') + 'kl. ' + tid + (it.adresse ? ' • ' + it.adresse : ''),
          tag: 'appt-' + it.id, url: './',
          glow: { ids: [String(it.id)], view: 'avtaler', sub: 'alle' }
        }, 'appt', String(it.id), subs)
        sent += r.ok; failed += r.fail
      }
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
    await heartbeat({ last_run: now.toISOString(), last_sent: sent + offers, last_failed: failed })
  } catch (e: any) {
    const msg = String(e?.message || e).slice(0, 500)
    console.error('notify-appointments feilet:', msg)
    await heartbeat({ last_run: now.toISOString(), last_error: msg, last_error_at: now.toISOString() })
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }

  return Response.json({ ok: true, sent, offers, failed })
})
