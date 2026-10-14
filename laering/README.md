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

## Gjennomgang med Claude (anbefalt hver 2.–4. uke)
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
