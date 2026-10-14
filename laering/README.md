# Læring: bedre datotolkning over tid

Appen tolker selgernes notater («Ring imrg 1430») til dato og klokkeslett. Dette er oppsettet for å
gjøre tolkningen bedre etter hvert som det kommer mer data.

## Hva appen lagrer (automatisk)
Hvert kort som er limt inn via AI får feltet `card.ai` med AI-ens forslag (`dato`, `raw`, `grunn`,
`kommentar`, `build`). Endrer selgeren datoen etterpå, ligger både AI-forslaget og selgerens valg på kortet.
Det er læringsdataene.

## Appen lærer selv (uten Claude)
`learnedHour()` i index.html: når AI lander på standardtiden 12:00, ser appen på hva denne selgeren
pleier å rette 12:00 til (siste 40 rettelser, minst 3 treff) og bruker hans vanlige time i stedet.
Haakon som alltid ringer kl 15 eller 21 får altså sine tider automatisk.

## Automatisk gjennomgang hver 14. dag
`kjor-gjennomgang.command` startes av launchd (`~/Library/LaunchAgents/no.snodriv.oppf-laering.plist`)
hver dag 09:30 og gjør bare noe når det er 14 dager siden sist:
1. Åpner appen i Chrome (der Christian er innlogget) med `?laering=1`. Appen (admin) laster ned en anonymisert
   fil `oppf-laering-DATO.json` (notat + datoer + AI-forslag, ingen navn/adresser/telefon, pluss appens
   API-nøkkel så eval kan kjøre). Skriptet flytter fila til `laering/data/`.
2. Kjører `claude -p` med `gjennomgang-prompt.md`: måler nullpunkt med `eval.mjs`, finner mønstre,
   forbedrer instruks/sikkerhetsnett, måler igjen og beholder bare forbedringer, sammenligner modeller
   (bytter bare ved tydelig gevinst), oppdaterer tester, funn.md og rapport-siste.md, committer lokalt.
3. Varsel på Macen med første linje i rapporten. Christian sier «push» til Claude for å publisere.

## eval.mjs – måling mot ekte notater
Sender hvert notat (tekst) med samme instruks og samme «Naa» som da kortet ble laget, og sammenligner
modellens dato med datoen som står på kortet (selgerens fasit). `--modeller` tester Sonnet/Haiku/Opus 5.5
og lav innsats. Alle kjøringer logges i `eval-historikk.md`. Nøkkel: `ANTHROPIC_API_KEY`, `laering/.apikey`
eller feltet `apikey` i datafila.

## Manuell gjennomgang med Claude (utenom automatikken)
1. Åpne appen i Chrome, innlogget som Christian. Be Claude kjøre `laering/analyse-i-nettleser.js`
   i fanen (koden fjerner navn, adresser og telefonnumre før noe leses ut).
2. Claude går gjennom `__L1` (kort uten dato som burde hatt dato) og `__L2` (datoer selgerne rettet),
   finner mønstre og oppdaterer AI-instruksen + sikkerhetsnettet i index.html.
3. Nye eksempler legges inn i `laering/tester.js`. Kjør `node laering/tester.js` – alt skal være OK.
4. Funn og endringer noteres i `laering/funn.md` med dato.

## Filer
- `tester.js` – regresjonstester for klokkeslett, «i morgen», ukedager, måneder, «om N dager».
- `analyse-i-nettleser.js` – uthenting + anonymisering i den innloggede fanen.
- `funn.md` – logg over hva som ble funnet og endret, per gjennomgang.
