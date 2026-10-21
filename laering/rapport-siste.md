ENDRINGER KLARE – si «push» til Claude for å publisere
Gjennomgang 21.10.2026 (build 2026-10-21-131). Andre automatiske kjøring.

Treff på NYE kort (51 brukbare, merket blindt; 14 fra andre selgere, resten dine egne snarvei-tester): appen selv 49/52 (14/14 hos de andre selgerne) → eval før 49/51 → etter 51/51.
Totalt (183 kort med fasit): riktig dag 180/183 → 182/183, riktig klokkeslett 64/64 → 64/64, kort uten dato som skulle hatt: 0 → 0, falske datoer: 2 → 0. Eneste bom igjen: Nicolais gamle «Ring ila neste uke» (AI velger av og til torsdag i stedet for mandag).
Lært klokkeslett: brukt 5 ganger, ingen rettet bort. Instruksen er uendret (15 837 tegn). Modellsjekk kjørt: Opus 5.5 var 1 kort bedre men dobbelt så treg; Sonnet 5.5 medium beholdes.

Hva som er endret (index.html 35 linjer, eval.mjs 12, tester.js 25, fasit.json +58 kort, funn.md, README, eval-historikk):
- «Hjemme tirsdag kl 17» skrevet en tirsdag før kl 17 = i dag (AI satte neste uke; samme feil som Jacobs «17/18 tiden tirsdag» 13.10). Sikkerhetsnett i koden.
- «Binding 20. februar … sende tilbud»: bindingsmåneder gir ikke lenger dato når AI sier «ingen» (koden satte 1. februar 2027).
- AI-svar med to JSON-objekter («Korrigering …»): appen leste det som ugyldig og gjorde nytt forsøk (sekunder ekstra). Nå brukes det siste, rettede objektet.
- Målefeil i eval.mjs rettet: tidsstemplene er UTC, eval leste dem som norsk tid (2 timer feil). Appen var aldri berørt. 2 gamle fasit-kort rettet.

Kort som bør rettes manuelt (dine egne testkort fra 19./20.10 – kan slettes): «Hjemme tirsdag kl 17» står 27.10, skulle vært 20.10 kl 17. «Binding 20. februar … sende tilbud» ×2 står 1. feb 2027, skal være uten dato.
De 7 gamle (Haakon februar/mars/«ringe 21», Eskil «neste uke») står fortsatt som 17.10 – alle forfalt, kan lukkes.

Spørsmål til Christian (svar i neste økt):
1. Rett etter midnatt: Fredrik skrev «I morgen etter 18» kl 00:12 natt til tirsdag og satte TIRSDAG. Du skrev «ring opp imorgen 15» kl 00:35 natt til tirsdag. Betyr «i morgen» da dagen som kommer (tirsdag) eller dagen etter (onsdag)? Svaret avgjør 4 usikre kort og om det skal bli en regel.
2. Du limte inn «03.11.2025» alene (to ganger 18.10). Skal et slikt notat gi dato 3. nov 2025 (forfalt), eller ingen dato (slik instruksen sier i dag)?
3. 39 av de 58 nye kortene er dine egne tester (19 tomme). Vil du at jeg skal holde kort fra deg selv utenfor målingen fremover?
4. En ucommitet endring i index.html fra 20.10 (tettere innboks-polling, build 131) lå i mappa da jeg startet. Den er lagt tilbake urørt etter commiten (ikke tatt med), nå merket build 132. Si fra om den skal committes.

Sjekkliste: [x] 2 signaler/stille feil  [x] 3 blind merking (58 kort, 6 usikre)  [x] 4 nullpunkt  [x] 5 mønstre med bevis  [x] 6 endringer + tester OK + syntaks OK  [x] 7 mål på nytt (forbedring beholdt)  [x] 8 modellsjekk (Sonnet 5.5 medium beholdes)
