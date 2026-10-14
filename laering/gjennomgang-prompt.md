Du kjører den automatiske læringsgjennomgangen for Oppfølginger-appen (index.html i denne mappa). Svar på norsk.
Christian er ikke-teknisk og leser bare rapporten. Ikke still spørsmål — gjør jobben ferdig.

## 1. Les
laering/README.md, laering/funn.md, laering/eval-historikk.md (hvis den finnes) og den NYESTE fila i laering/data/
(anonymiserte kort: notat, AI-ens dato (ai.dato/ai.raw/ai.grunn) og datoen som står på kortet nå = selgerens fasit).

## 2. Mål nullpunktet
Kjør `node laering/eval.mjs --json > laering/data/eval-for.json` (appens modell og instruks mot ekte notater).
Noter «riktig dag»-prosent og «ga ingen dato (feil)». Les bommene (feltet bom) — det er der instruksen svikter.

## 3. Finn mønstre siden forrige gjennomgang (datoer i funn.md; bruk ai.ts / opprettet)
a) aktive kort UTEN dato der notatet har dag-/tids-/månedsord → tolkningen bommet.
b) kort der selgeren endret AI-datoen → hva mente selgeren? Skill tolkningsFEIL («imorgen 1430» ble 12:00)
   fra personlige valg (selger flyttet ringing til en annen dag).
c) bommene fra eval-kjøringen i steg 2.
d) sjekk om de lærte klokkeslettene (learnedHour) blir rettet bort fra — da er regelen for aggressiv.

## 4. Forbedre instruksen og sikkerhetsnettet
Minste mulige endring i index.html: AI-instruksen (strengene 'Datoregler — FOERSTE PRIORITET' / 'DAG:' / 'TID:')
og/eller hjelperne mellom [[LAER-START]] og [[LAER-END]] + sikkerhetsnettet etter dem. Behold stilen.
Legg nye ekte eksempler i laering/tester.js. `node laering/tester.js` — ALT må være OK.
Syntakssjekk: trekk ut script-blokk nr. 2 fra index.html og kjør `new Function(src)` i node.

## 5. Mål på nytt og behold bare forbedringer
Kjør `node laering/eval.mjs --json > laering/data/eval-etter.json`. Sammenlign med steg 2:
- «riktig dag» må være minst like høy OG «ga ingen dato (feil)» ikke høyere → behold.
- ellers: `git checkout -- index.html`, gjør en mindre/annen endring, mål igjen (maks 3 forsøk).
  Får du det ikke bedre: behold originalen og skriv i funn.md hva du prøvde.

## 6. Modellsjekk (bare når det er minst 40 kort i testsettet)
Kjør `node laering/eval.mjs --modeller --json > laering/data/eval-modeller.json`. Bytt modell/innsats i
index.html (AI_MODEL_KEY / AI_EFFORT) KUN hvis en kandidat er minst 3 prosentpoeng bedre på «riktig dag»,
eller like god (±1 poeng) og minst 30 % raskere på median. Skriv begrunnelsen i kommentaren bak konstanten
og i funn.md. Ved tvil: behold dagens modell.

## 7. Dokumenter
- Øk app-build i <meta name="app-build"> (format ÅÅÅÅ-MM-DD-NNN, NNN = forrige + 1) hvis index.html er endret.
- Ny seksjon ØVERST i laering/funn.md med dagens dato: tall (kort, med AI, rettet, uten dato med tidsord,
  eval før/etter, modellsammenligning), funn, hva som ble endret, hva som bevisst ikke ble endret.
- laering/rapport-siste.md: maks 15 linjer, enkelt språk. Første linje er enten
  «ENDRINGER KLARE – si «push» til Claude for å publisere» eller «INGEN ENDRINGER NØDVENDIG».
- `git add -A && git commit` med kort norsk melding som slutter med «(build …)» og linja
  «Co-Authored-By: Claude <noreply@anthropic.com>». IKKE push — Christian publiserer selv.

Mangler datafila, eller feiler eval.mjs på API-nøkkel: skriv det i rapport-siste.md, commit ingenting, og stopp.
