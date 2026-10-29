// Lager læringsfila (samme format som appens laeringEksport i index.html) fra rå databaserader — for skyjobben, uten Chrome.
// Bruk:  node laering/eksport.mjs <raa.json> [ut.json]
//   raa.json = {"snapshots":[{email,data,app_build,last_seen_at}…], "feil":[{email,kind,msg,at,build}…], "apikey":"…"}
//   (snapshots: select email,data,app_build,last_seen_at from oppf_snapshots; feil: client_log siste 30 d, kind in ('ai','js','promise');
//    apikey: select anthropic_key from app_config where id=1)
// Anonymiserer som appen: notattekst beholdes (telefonnumre maskeres), navn/adresser/telefon tas ALDRI med; felt-rettelser bare som koder.
import { readFileSync, writeFileSync } from 'node:fs';
const inn = process.argv[2]; if (!inn) { console.error('bruk: node laering/eksport.mjs <raa.json> [ut.json]'); process.exit(2); }
const raa = JSON.parse(readFileSync(inn, 'utf8'));
const scrub = t => String(t || '').replace(/\d{8,}|(\d{2,3}\s?){3,4}/g, '[tlf]').replace(/\s+/g, ' ').trim();
const feltKode = (a, b) => { a = String(a == null ? '' : a).trim().toLowerCase(); b = String(b == null ? '' : b).trim().toLowerCase(); return a === b ? 'lik' : (!a && b ? 'fylt' : (a && !b ? 'slettet' : 'endret')); };
const iso = v => { if (v == null) return null; const d = new Date(v); return isNaN(d) ? null : d.toISOString().slice(0, 16); };
const out = [], selgere = [];
for (const x of raa.snapshots || []) {
  const who = String(x.email || '').split('@')[0];
  selgere.push({ who, build: x.app_build || null, sistSett: x.last_seen_at ? String(x.last_seen_at).slice(0, 16) : null });
  for (const i of (Array.isArray(x.data) ? x.data : [])) {
    if (!i) continue;
    out.push({ who, opprettet: iso(i.opprettet), state: i.state, status: i.status, nextAction: i.nextAction || null,
      dato: i.dato || null, kommentar: scrub(i.kommentar),
      felt: (i.ai && i.ai.felt) ? { navn: feltKode(i.ai.felt.navn, i.navn), alder: feltKode(i.ai.felt.alder, i.alder), telefon: feltKode(i.ai.felt.telefon, i.telefon), salgsrunde: feltKode(i.ai.felt.salgsrunde, i.salgsrunde), adresse: feltKode(i.ai.felt.adresse, i.adresse), status: feltKode(i.ai.felt.status, i.status), handling: feltKode(i.ai.nextAction, i.nextAction), kommentar: feltKode(i.ai.kommentar, i.kommentar), dato: feltKode(i.ai.dato, i.dato) } : null,
      enhet: (i.ai && i.ai.enhet) || null,
      ai: i.ai ? { dato: i.ai.dato || null, raw: i.ai.raw || null, fallback: !!i.ai.fallback, eksakt: !!i.ai.eksakt, grunn: scrub(i.ai.grunn), kommentar: scrub(i.ai.kommentar), tidLaert: i.ai.tidLaert || null, tidFraNotat: !!i.ai.tidFraNotat, aarFikset: !!i.ai.aarFikset, ms: i.ai.ms || null, tok: i.ai.tok || null, bilde: i.ai.bilde || null, build: i.ai.build || null, ts: iso(i.ai.ts) } : null });
  }
}
const feil = (raa.feil || []).map(r => ({ who: String(r.email || '').split('@')[0], kind: r.kind, msg: scrub(r.msg).slice(0, 80), at: String(r.at || '').slice(0, 16), build: r.build || null }));
const medAi = out.filter(i => i.ai).length, rettet = out.filter(i => i.ai && i.ai.dato !== i.dato).length;
const res = { hentet: new Date().toISOString(), antall: out.length, medAi, rettet, apikey: raa.apikey || '', selgere, feil, kort: out };
const ut = process.argv[3] || ('laering/data/laering-' + new Date().toISOString().slice(0, 10) + '.json');
writeFileSync(ut, JSON.stringify(res, null, 1));
console.log('skrev ' + ut + ': ' + out.length + ' kort, ' + medAi + ' med AI, ' + selgere.length + ' selgere, ' + feil.length + ' feilrader');
