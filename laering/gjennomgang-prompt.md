Du kjører den automatiske læringsgjennomgangen for Oppfølginger-appen (index.html i denne mappa). Svar på norsk.
Christian er ikke-teknisk og leser bare rapporten. Ikke still spørsmål underveis — gjør jobben ferdig. Vær grundig
og nøktern: det du endrer treffer 14 selgere, og en dårlig regel er verre enn ingen regel.

## 0. Prinsipper for å lære riktig (les før du starter)
- **Nye kort er den ekte testen.** Regler laget før kortet fantes, målt på kortet = sann treffsikkerhet.
  Alle gamle kort er «lukket bok». Rapporter alltid tallet for nye kort først.
- **Blind merking.** Når du setter fasit for et nytt kort: les notat + «nå» og bestem datoen FØR du ser på
  ai.dato, ai.grunn og kortets dato. Ellers forankrer du deg i AI-ens svar og lærer ingenting.
- **Bevis før regel.** Endre instruks/kode bare for et mønster som (a) forekommer i ≥2 kort, eller (b) er
  åpenbart generelt (en forkortelse, en skrivemåte). Ett enkeltstående rart notat → merknad i fasit, ingen regel.
- **Selgerens rettelse er et hint, ikke fasit.** Flyttet han dagen uten at notatet sier det, er det et personlig
  valg (merk «personlig valg»). Rettet han klokkeslettet fra 12:00, si fra om learnedHour ikke allerede dekker det.
- **Minste endring. Rydd også.** Instruksen skal ikke bare vokse: finnes det to regler som sier det samme, eller
  en regel ingen kort har trengt på 3 gjennomganger, slå sammen/forenkle – og mål at treffprosent er uendret.
- **Usikkerhet er lov.** Er et notat tvetydig: usikker=true og legg det i rapportens «Spørsmål til Christian».
- **Christians egne kort teller – unntatt tester.** Kort fra christian.rasch er ekte selgerkort, UNNTATT når han tester
  appen (tomme notater, kopier av samme notat, mange kort på få minutter, konstruerte notater). Sett `test: true` i fasit
  på slike – da er de utenfor alle tall. eval.mjs holder umerkede Christian-kort som ser ut som tester utenfor av seg selv
  (`testkort`). Lag aldri regler av testkort alene; de kan bare bekrefte et mønster som finnes hos selgerne.
- **Svar Christian alt har gitt** står i funn.md under «Svar fra Christian». De gjelder som regler. Still ikke samme
  spørsmål igjen. Kort med `laStaa: true` i fasit har han sagt skal stå – de skal ikke listes som «bør rettes».

## 1. Les
laering/README.md, laering/funn.md (forrige gjennomganger – hva ble prøvd, hva ble bevisst ikke gjort),
laering/eval-historikk.md, laering/fasit.json og den NYESTE fila i laering/data/.

## 2. Signaler og stille feil (uten API)
`node laering/eval.mjs --bare-data --json > laering/data/stille.json`. Les: signal (nye kort siden sist, rettet,
uten dato m/tidsord, stille feil), laertTime (hvor ofte selgerne retter bort fra lært klokkeslett – >30 % betyr at
regelen er for aggressiv), notatEndretEtterImport, promptTegn (instruksens størrelse – skal ikke vokse ukontrollert).

## 2b. Fart (uten API) – læring på hvor tiden går
Samme stille.json har `fart` (fra build 148, 28.10.2026): medianer for AI-svartid (`aiMs`), fra bilde klart til svar
(`totalMs`), skjematid (`skjemaMs` = fra AI-skjemaet åpnet til selgeren lagret), komprimering, andel med flere forsøk,
med prosa før JSON-en, kald start, cache-treff, ut-tokens og bildestørrelse – totalt, for nye kort, pr. selger og pr.
bildestørrelse (`prBildePx`). Selgeren skal kunne lagre kortet raskest mulig, så se etter: (a) selgere/kort der AI-tiden
er mye høyere enn medianen (dekning? prosa?), (b) skjematid som vokser (selgeren må rette mye → tolkningsfeil, ikke fart),
(c) etter et bildebytte: er treffet på nye kort med `bilde.px`=1280 like godt som med 1400? Les funn.md 17.10 og 28.10 før
du foreslår fartsgrep: JSON-først, «maks to setninger», omrokkering, prefill, effort low, json_schema og ekstra kall er
målt og forkastet – ikke test dem igjen. Fartsmotiverte instruksendringer går gjennom samme port som alt annet (steg 7:
behold bare om treffet ikke blir dårligere). Skriv tallene i rapporten under «Fart».

## 3. Merk nye kort i fasiten (blind, se 0)
For HVERT AI-kort uten fasit (umerket): gull «ÅÅÅÅ-MM-DDTHH:MM» eller null; tidFri; usikker; merknad.
Legg inn i laering/fasit.json (id = who|opprettet|md5(kommentar)[0:10], se eval.mjs), kilde «Claude-gjennomgang
<dato>», oppdater «oppdatert».

## 4. Mål nullpunktet
`node laering/eval.mjs --json > laering/data/eval-for.json`. Noter NYE kort: dag, og totalt: kjede dag/eksakt,
ingen-dato-feil, falsk dato. Les bom (modell/kode som svikter) og stilleFeil (til rapporten).

## 5. Finn mønstre – med bevis
a) bommer på nye kort (viktigst), b) bommer totalt, c) selgerrettelser som er tolkningsfeil (ikke personlige valg),
d) nye forkortelser/dialekt/skrivemåter, e) lært klokkeslett som rettes bort fra.
Tell forekomster. Bare mønstre med bevis (se 0) går videre.

## 6. Forbedre – minste mulige endring
AI-instruksen (aiPromptStatic: 'Datoregler — FOERSTE PRIORITET' / 'DAG:' / 'TID:') og/eller koden mellom
[[LAER-START]] og [[LAER-END]]. Behold stilen. Ikke rør noe utenfor uten svært god grunn. Vurder rydding (se 0).
Legg ekte eksempler i laering/tester.js (enkelttester + pipeline-tester med normaliserDato).
`node laering/tester.js` — ALT må være OK. Syntakssjekk: script-blokk nr. 2 → `new Function(src)` i node.

## 7. Mål på nytt – behold bare forbedringer
`node laering/eval.mjs --json > laering/data/eval-etter.json`. Behold hvis: NYE kort: dag ikke lavere, kjede dag
ikke lavere, ingen-dato-feil og falsk dato ikke høyere. Ellers `git checkout -- index.html`, mindre endring, mål
igjen (maks 3 forsøk). Blir det ikke bedre: behold originalen, skriv i funn.md hva du prøvde og hvorfor det ikke hjalp.

## 8. Modellsjekk (bare ved ≥40 nye kort siden forrige modellsjekk, se funn.md)
`node laering/eval.mjs --modeller --json > laering/data/eval-modeller.json`. Bytt AI_MODEL_KEY/AI_EFFORT KUN ved
≥3 prosentpoeng bedre «kjede: dag», eller like god (±1) og ≥30 % raskere. Begrunn i kommentaren og i funn.md.

## 9. Dokumenter og lever
- Øk app-build (<meta name="app-build">, ÅÅÅÅ-MM-DD-NNN) hvis index.html er endret.
- Ny seksjon ØVERST i funn.md: utløser, tall (nye kort, merket, rettet, stille feil, lært time, eval før/etter på
  nye og totalt, promptstørrelse), mønstre med forekomster, endringer, hva som bevisst ikke ble gjort, trend
  (siste 3 målinger fra eval-historikk).
- laering/rapport-siste.md (maks 25 linjer, enkelt språk):
  linje 1: «ENDRINGER KLARE – si «push» til Claude for å publisere» eller «INGEN ENDRINGER NØDVENDIG»
  deretter: treff på nye kort (før → etter), totalt, hva som er endret (én linje per endring, `git diff --stat`),
  «Fart» (én–to linjer: medianer fra steg 2b, og hva som evt. skiller seg ut pr. selger),
  «Kort som bør rettes manuelt» (selger, notat, riktig dato; ikke kort med `laStaa: true`), «Spørsmål til Christian» (usikre notater, maks 5 –
  han svarer i neste økt), og en sjekkliste over steg 2–8 med [x]/[ ].
- `git add -A && git commit` med kort norsk melding som slutter med «(build …)» og linja
  «Co-Authored-By: Claude <noreply@anthropic.com>». IKKE push — Christian publiserer selv.

Mangler datafila, eller feiler eval.mjs på API-nøkkel: skriv det i rapport-siste.md, commit ingenting, og stopp.
