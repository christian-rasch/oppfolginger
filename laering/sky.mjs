// Snakker med databasen for læringsjobben. Læringsfilene (fasit.json, funn.md, eval-historikk.md, rapport-siste.md) ligger i
// tabellen oppf_laering_filer – ALDRI i repoet, som er offentlig. Lokalt ligger de i laering/data/ (gitignored).
// Rådata til eksport.mjs hentes samme vei (erstatter kopiering av SQL-resultater via samtalen i skyjobben, og Chrome på Macen).
// Bruk:  node laering/sky.mjs hent          → skriver de fire filene fra databasen til laering/data/
//        node laering/sky.mjs lagre [av]    → laster laering/data/<fil> opp igjen (av = skyjobb | mac | claude-lokal); gamle versjoner arkiveres i databasen
//        node laering/sky.mjs liste         → hva som ligger i databasen
//        node laering/sky.mjs eksport       → laering/data/raa.json (snapshots + feil 30 d + API-nøkkel) til `node laering/eksport.mjs laering/data/raa.json`
// Token: miljøvariabelen LAERING_TOKEN, ellers fila laering/data/.token. Hentes med
//   select token from public.oppf_laering_noekkel where id = 1;   (bare via Supabase-koblingen – aldri i repo, logg, rapport eller svar)
// URL og anon-nøkkel leses fra index.html (CLOUD_SYNC_CONFIG). Sikkerheten ligger i tokenen: RPC-funksjonene avviser alt annet.
// I skyen: trafikken går via sandkassens proxy (curl brukes automatisk når HTTPS_PROXY er satt), og miljøet må tillate *.supabase.co.
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
const HERE = dirname(fileURLToPath(import.meta.url)), DATA = join(HERE, 'data');
const FILER = ['fasit.json', 'funn.md', 'eval-historikk.md', 'rapport-siste.md'];
const html = readFileSync(join(HERE, '..', 'index.html'), 'utf8');
const URL_ = (/supabaseUrl:"([^"]+)"/.exec(html) || [])[1], ANON = (/supabaseAnonKey:"([^"]+)"/.exec(html) || [])[1];
if (!URL_ || !ANON) { console.error('fant ikke supabaseUrl/supabaseAnonKey i index.html'); process.exit(2); }
const tokenFil = join(DATA, '.token');
const TOKEN = (process.env.LAERING_TOKEN || (existsSync(tokenFil) ? readFileSync(tokenFil, 'utf8') : '')).trim();
if (!TOKEN) { console.error('Mangler token: sett LAERING_TOKEN eller skriv den til laering/data/.token (select token from oppf_laering_noekkel where id = 1)'); process.exit(2); }
// I skyen (Claude Code-sandkassen) går all trafikk gjennom en proxy (HTTPS_PROXY) som Node sin fetch ikke bruker av seg selv;
// curl gjør det. Derfor: curl når HTTPS_PROXY er satt (eller SKY_CURL=1), ellers fetch. Domenet må i tillegg stå på miljøets
// liste over tillatte adresser (Network access → Custom → Allowed domains: *.supabase.co), ellers svarer proxyen 403.
const BRUK_CURL = !!(process.env.HTTPS_PROXY || process.env.https_proxy || process.env.SKY_CURL);
function rpcCurl(fn, body) {
  const tmp = join(tmpdir(), 'sky-' + process.pid + '-' + Date.now() + '.json'); writeFileSync(tmp, body);
  try {
    const r = spawnSync('curl', ['-sS', '--max-time', '120', '-w', '\n%{http_code}', '-X', 'POST', URL_ + '/rest/v1/rpc/' + fn,
      '-H', 'apikey: ' + ANON, '-H', 'Authorization: Bearer ' + ANON, '-H', 'Content-Type: application/json', '--data-binary', '@' + tmp],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(fn + ' → curl feilet: ' + (r.stderr || '').trim().slice(0, 300));
    const out = r.stdout, i = out.lastIndexOf('\n'), code = +out.slice(i + 1), t = out.slice(0, i);
    if (code < 200 || code >= 300) throw new Error(fn + ' → HTTP ' + code + ': ' + t.slice(0, 300));
    return t ? JSON.parse(t) : null;
  } finally { try { unlinkSync(tmp); } catch {} }
}
async function rpc(fn, args) {
  const body = JSON.stringify({ p_token: TOKEN, ...args });
  if (BRUK_CURL) return rpcCurl(fn, body);
  const r = await fetch(URL_ + '/rest/v1/rpc/' + fn, { method: 'POST',
    headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' }, body });
  const t = await r.text();
  if (!r.ok) throw new Error(fn + ' → HTTP ' + r.status + ': ' + t.slice(0, 300));
  return t ? JSON.parse(t) : null;
}
const kmd = process.argv[2];
mkdirSync(DATA, { recursive: true });
if (kmd === 'liste') {
  const l = await rpc('laering_liste', {});
  for (const f of l) console.log(f.navn.padEnd(20), String(f.lengde).padStart(7), 'tegn', f.oppdatert, f.oppdatert_av || '');
  if (!l.length) console.log('(tomt)');
} else if (kmd === 'hent') {
  let n = 0;
  for (const navn of FILER) {
    const v = await rpc('laering_hent', { p_navn: navn });
    if (v == null) { console.log('mangler i databasen:', navn); continue; }
    writeFileSync(join(DATA, navn), v); n++; console.log('hentet', navn, v.length, 'tegn');
  }
  if (!n) { console.error('ingen filer hentet'); process.exit(1); }
} else if (kmd === 'lagre') {
  const av = process.argv[3] || 'ukjent';
  for (const navn of FILER) {
    const p = join(DATA, navn);
    if (!existsSync(p)) { console.log('finnes ikke lokalt, hopper over:', navn); continue; }
    const inn = readFileSync(p, 'utf8');
    if (navn.endsWith('.json')) JSON.parse(inn);                       // aldri lagre ødelagt JSON
    await rpc('laering_lagre', { p_navn: navn, p_innhold: inn, p_av: av });
    console.log('lagret', navn, inn.length, 'tegn');
  }
} else if (kmd === 'eksport') {
  const d = await rpc('laering_eksport', {});
  writeFileSync(join(DATA, 'raa.json'), JSON.stringify(d));
  console.log('skrev laering/data/raa.json:', (d.snapshots || []).length, 'selgere,', (d.feil || []).length, 'feilrader,', d.apikey ? 'API-nøkkel med' : 'INGEN API-nøkkel');
} else { console.error('bruk: node laering/sky.mjs hent | lagre [av] | liste | eksport'); process.exit(2); }
