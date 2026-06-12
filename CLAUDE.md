# Oppfølginger — feltapp for dørsalg (overlevering)

Eier: Christian (norsk dørselger, ikke utvikler). Svar alltid på norsk. Én HTML-fil (`index.html`), ingen backend, dummy/ekte data lagres lokalt.

## Arbeidsregler (viktigst)
- **Minste effektive endring.** Endre KUN det som bestilles — aldri redesign, aldri røre andre views/faner.
- QA etter hver endring: headless Chrome (puppeteer), 1024×1366, sjekk `pageerror` + ta skjermbilde og SE på det.
- Syntakssjekk: trekk ut script-blokk nr. 2 → `node --check`.
- Base64-bildene (THUMB/FULL, kart) skal ALDRI skrives på nytt — alltid gjenbrukes via grep fra eksisterende fil.
- «Det ble dårlig» = overskridelse; rull tilbake til bestillingen.

## Visuell stil
Mørk premium cockpit. Fonter: Schibsted Grotesk + JetBrains Mono. Tokens i `:root`: `--mint #3DF5C5` (utført/positivt), `--gold #E8C26B` (handling gjenstår), `--red #FF5A5F` (KUN kritisk), `--hair/--hair-2` (kantlinjer), `--ink-*` (tekstnivåer). Gull = gjenstår, mint = gjort, rød = alarm. Aldri rød for normal fremdrift.

## Datamodell (oppf:index i lagring)
`{id,navn,alder,telefon,adresse,salgsrunde,status:'HP|HC|Vula',kanal,kommentar,dato|null,state:'aktiv|fulgt',stjerner:0–3,handlinger:[{t:'mail',done,ts}],kontaktlogg,sistKontakt,svart:ts|null,opprettet}` + `migrate()` setter defaults.
- `pendMail(it)` = mail lovet, ikke sendt → gull chip «Kunde venter på mail» (avhukbar, toggle).
- `mailSent(it)` = sendt → mint «Mail sendt ✅» (toggle tilbake).
- I Mail-filteret: `!svart` → gull «Venter på svar» (avhukbar) / `svart` → mint «Kunde svart ✅» (toggle). Kort får gull-/mint-kant.
- Filtre: I dag · Denne uken · Alle · Handling kreves (teller, RØD når >0) · Mail (teller) · Uten dato (teller).
- Alle statusendringer har Angre via toast.

## Lagring
`window.storage` (artifact) med localStorage-fallback. Nøkler: `oppf:index`, `oppf:apikey`. «Kopier alt»/«Importer» = manuell backup (flettes på id). På iOS er hjemskjerm-PWA og Safari to adskilte lagre.

## AI-import (📷 Lim inn)
Skjermbilde av kart-app → komprimeres (canvas, maks 1400px, jpeg 0.72, FileReader — ALDRI blob-URL) → `aiCall()`: med API-nøkkel = XMLHttpRequest direkte mot api.anthropic.com (modell `claude-sonnet-4-6`), uten nøkkel = fetch via Claude-broen (modell `claude-sonnet-4-20250514`). Tidsavbrudd: ping 12 s, analyse 90 s, XHR 60 s. Oppvarming maks 15 forsøk, ender ALLTID i synlig status (klikkbar retry). Prompt returnerer ren JSON (navn/alder/adresse/salgsrunde/status/telefon/kommentar/pin-match/kanal/lovetMail/dato; datoer alltid frem i tid).
Kjent: publisert claude-delingsside blokkerer direktekall (CSP) → derfor GitHub Pages.

## QA-oppskrift (lokalt)
`node` med puppeteer: launch headless, `file://`-URL, viewport 1024×1366, `page.on('pageerror')`, klikk i UI, `page.screenshot()`. Stub `window.XMLHttpRequest` i `evaluateOnNewDocument` for å teste AI-flyt uten nett.

## Ønsket videre (ikke påbegynt)
Push-varsler (krever PWA på fast adresse — nå mulig), SMS-handlinger, ev. ekte backend/API senere.
