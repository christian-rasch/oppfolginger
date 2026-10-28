# Læring: bedre datotolkning over tid

Appen tolker selgernes notater («Ring imrg 1430») til dato og klokkeslett. Dette er oppsettet for å
gjøre tolkningen bedre etter hvert som det kommer mer data.

## Hva appen lagrer (automatisk)
Hvert kort som er limt inn via AI får feltet `card.ai` med AI-ens forslag (`dato`, `raw`, `grunn`,
`kommentar`, `build`). Endrer selgeren datoen etterpå, ligger både AI-forslaget og selgerens valg på kortet.
Det er læringsdataene.

## Appen lærer selv (uten Claude)
`learnedHour()` i index.html: når AI lander på standardtiden 12:00, ser appen på hva denne selgeren
pleier å sette (siste 40 stemmer, minst 3 treff) og bruker hans vanlige time i stedet. Fra 28.10.2026 teller både
rettelser bort fra 12:00, kort der selgeren BEHOLDT den lærte timen, og rettelser bort fra den lærte timen (så den kan avlæres).
Haakon som alltid ringer kl 15 eller 21 får altså sine tider automatisk.

## Fart (fra build 148, 28.10.2026)
Hvert AI-kort bærer `ai.ms` (komprimering, venting på oppvarming, selve AI-kallet, totalt fra bilde klart, skjematid = fra
skjemaet åpnet til selgeren lagret, forsøk, prosa før JSON, kald start), `ai.tok` (tokens) og `ai.bilde` (px, KB). Admin-lista i
Min profil viser «AI median … · skjema median …» pr. selger (30 dager). `eval.mjs --bare-data` skriver `fart` (totalt, nye kort,
pr. selger, pr. bildestørrelse), og gjennomgangen leser det i steg 2b. `bilde-ab.js` er A/B-testen som avgjør om AI-en kan få et
mindre bilde (1280 px/0,65) uten at tolkningen endres – beslutningsregelen står i funn.md 28.10.

## Automatikken: lærer når det finnes noe å lære av
`kjor-gjennomgang.command` startes hver dag 09:30 av launchd (`~/Library/LaunchAgents/no.snodriv.oppf-laering.plist`)
– ikke direkte, men via den lille appen `~/Applications/Oppfolginger-laering.app`. Grunn: macOS nekter zsh startet av
launchd å lese Skrivebord og Nedlastinger (feilkode 127, ingenting i loggen), mens en app kan få den tillatelsen.
Appen er laget slik (gjenskap ved behov, og signer på nytt etter endring i Info.plist):
`osacompile -o ~/Applications/Oppfolginger-laering.app fil.applescript` med én linje
`do shell script "/bin/zsh '<sti til kjor-gjennomgang.command>' >/dev/null 2>&1 || true"`, deretter
`plutil -replace LSUIElement -bool true .../Contents/Info.plist` og `codesign --force --sign - <app>`.
Krever at Macen er på og at Christian er innlogget i appen i Chrome. Test uten Claude: `touch laering/.bare-signal`
og `launchctl kickstart gui/$(id -u)/no.snodriv.oppf-laering` (slett flagget etterpå).
1. **Daglig, uten Claude:** åpner appen i Chrome med `?laering=1` → appen (admin) laster ned en anonymisert fil
   (notat, datoer, AI-forslag, teksten AI leste, lært-time-flagg, API-nøkkel). Skriptet flytter fila til
   `laering/data/` (10 siste beholdes) og teller læringssignaler med `eval.mjs --bare-data`: nye AI-kort siden
   forrige gjennomgang, selgerrettelser, stille feil, kort uten dato med tidsord.
2. **Full gjennomgang (Claude, effort high) bare når det er noe å lære av:** ≥12 nye kort, eller ≥3 rettelser,
   eller ≥1 stille feil, eller ≥2 nye uten dato – men aldri oftere enn hver 3. dag, og minst hver 28. dag uansett.
   Claude følger `gjennomgang-prompt.md`: blind merking av nye kort i fasiten, måling på NYE kort først (den
   ekte testen), bevis før regel, minste endring + rydding, mål igjen og behold bare forbedringer, modellsjekk
   ved nok nye kort, rapport med «kort som bør rettes» og «spørsmål til Christian», commit lokalt.
3. Robusthet: lås mot dobbeltkjøring, vakthund (maks 90 min), stempel settes bare ved vellykket kjøring (ellers
   nytt forsøk neste dag, maks 3), varsel på Macen med rapportens første linje. Christian sier «push».

## fasit.json – «Claudes øyne»
Datoen som står på et kort er ikke nødvendigvis riktig: selgeren kan ha godtatt en feil uten å se den, eller
flyttet dagen av personlige grunner. Derfor har hvert AI-kort en egen fasit: hva selgeren MENTE da notatet ble
skrevet, lest bokstavelig (gull), om klokkeslettet er fritt (tidFri) og om notatet er tvetydig (usikker).
Første 160 kort ble vurdert av Claude 15.10.2026; gjennomgangen merker nye kort hver gang.
«Stille feil» = kort som står på feil dag uten at noen har rettet – de havner i rapporten til Christian.
Fra 22.10.2026: `test: true` = Christians egne testkort (telles ikke; umerkede testkort fra ham oppdages av eval.mjs selv:
tomt notat, kopi innen 24 t, ≥3 andre kort innen ±10 min). `laStaa: true` = feil kort Christian har sagt skal stå (ikke i rapporten).
Christians svar på gjennomgangenes spørsmål samles i funn.md under «Svar fra Christian» og gjelder som regler.

## eval.mjs – måling mot fasiten
Sender hvert notat (tekst) med samme instruks, samme meldingsstruktur (fast del hurtigbufret) og samme «Naa»
som da kortet ble laget. NB: `opprettet`/`ai.ts` i eksporten (og `naa` i fasit.json) er UTC – norsk tid er 1–2 timer
senere. eval.mjs legger på «Z» før det regner (rettet 21.10.2026; før det var «Naa» 2 timer for tidlig). Måler både modellen alene (rå) og hele kjeden (modell + normaliserDato = det selgeren
får). Tall: riktig dag, eksakt tid (bare der notatet sier tid), ingen-dato-feil, falsk dato.
`--modeller` tester Sonnet/Haiku/Opus 5.5 og lav innsats. `--bare-data` gir stille feil uten API-kall.
Alle kjøringer logges i `eval-historikk.md`. Nøkkel: `ANTHROPIC_API_KEY`, `laering/.apikey` eller feltet
`apikey` i datafila.

## Koden som kan testes utenfor appen
Alt mellom `[[LAER-START]]` og `[[LAER-END]]` i index.html er ren logikk uten DOM: regex-konstanter,
timeFromText/timeWordFromText/daysAheadFromText og normaliserDato (hele etterbehandlingen av AI-ens dato).
tester.js laster blokken direkte, så en endring i appen testes 1:1.

## Manuell gjennomgang med Claude (utenom automatikken)
1. Åpne appen i Chrome, innlogget som Christian. Be Claude kjøre `laering/analyse-i-nettleser.js`
   i fanen (koden fjerner navn, adresser og telefonnumre før noe leses ut).
2. Claude går gjennom `__L1` (kort uten dato som burde hatt dato) og `__L2` (datoer selgerne rettet),
   finner mønstre og oppdaterer AI-instruksen + sikkerhetsnettet i index.html.
3. Nye eksempler legges inn i `laering/tester.js`. Kjør `node laering/tester.js` – alt skal være OK.
4. Funn og endringer noteres i `laering/funn.md` med dato.

## Filer
- `tester.js` – regresjonstester: klokkeslett, «i morgen», ukedager, måneder, «om N dager» + hele kjeden (normaliserDato).
- `fasit.json` – hva selgeren mente, per AI-kort (gull/tidFri/usikker/merknad).
- `eval.mjs` – måling mot fasiten, modellsammenligning, stille feil.
- `gjennomgang-prompt.md` – instruksen den automatiske gjennomgangen følger.
- `kjor-gjennomgang.command` – jobben launchd starter.
- `analyse-i-nettleser.js` – uthenting + anonymisering i den innloggede fanen.
- `funn.md` – logg over hva som ble funnet og endret, per gjennomgang.
- `bilde-ab.js` – A/B-test av bildestørrelse til AI-en (kjøres i innlogget admin-fane; resultat i funn.md).
