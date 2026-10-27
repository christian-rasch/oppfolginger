ENDRINGER KLARE – si «push» til Claude for å publisere (build 2026-10-27-137, committet lokalt).
Gjennomgang 27.10.2026. Fjerde automatiske kjøring. Utløser: 4 rettelser (6 nye kort).

Treff på NYE kort (9 merket blindt, 7 brukbare: 1 er ditt tomme testkort, 1 er Eskils notat som ble endret etter import): appen selv 7/7 → eval før 7/7 → etter 7/7.
Totalt (163 kort med fasit, dine testkort holdt utenfor): riktig dag 163/163, riktig klokkeslett 67/67, kort uten dato som skulle hatt: 0, falske datoer: 0. Stille feil: 0.
De 4 rettelsene er bare klokkeslett (Joshua og Eskil 12 → 17, Haakon 12 → 13:45 og 15) på notater uten tid. Ingen tolkningsfeil. Eskil har nå rettet til 17 tre ganger, så appen lærer 17:00 for ham av seg selv.
Lært klokkeslett: brukt 12 ganger (Haakon kl 21), 2 rettet bort (17 %, grensen er 30 %). Instruksen er uendret (15 837 tegn).

Hva som er endret (git diff --stat: index.html +4/−2, fasit.json +9 kort, tester.js +15 linjer, eval-historikk.md, funn.md, rapport):
- index.html: sikkerhetsnettet forstår nå «ring opp mandag 15» / «ring opp imorgen 15» som kl 15 (Haakon skrev det to ganger; AI traff, men koden ville gitt kl 12 hvis AI hadde bommet). «Ring mandag 7 juli» er fortsatt en dato, ikke kl 19.
- fasit.json: 9 nye kort fått fasit (1 usikker, 1 test).
- tester.js: 22 nye tester fra ekte kort. 184 tester OK, syntaks OK. Måling før/etter helt lik (163/163), så endringen er trygg.
- Ikke committet: AGENTS.md og HJELP-forslag.md (ligger fortsatt utenfor, som før).

Kort som bør rettes manuelt: ingen.

Spørsmål til Christian (svar i neste økt):
1. Ubesvart fra 24.10: «Ringe neste mandag» skrevet torsdag – mandag i neste uke (26.10, som Haakon beholdt) eller mandagen etter (2.11, som instruksen sier)?
2. Ubesvart fra 24.10: skal setningen «samme ukedag + klokkeslett = i dag» fjernes fra instruksen uten måling? (Koden gjør +7 uansett, ufarlig.)
3. Ubesvart fra 24.10: skal «januar» alene bety første virkedag (7. jan) i stedet for 1. januar?
4. Nytt: Haakons lærte klokkeslett (21) henger på nøyaktig 3 gamle rettelser. Sletter han ett av dem, forsvinner kl 21 for ham. Skal appen også telle kort der han GODTOK kl 21 (9 stk)? Da blir det mer robust, men tregere å avlære.

Sjekkliste: [x] 2 signaler/stille feil  [x] 3 blind merking (9 kort, 1 usikker, 1 test)  [x] 4 nullpunkt (100 %)  [x] 5 mønstre med bevis (1 fikk regel)  [x] 6 tester + syntaks OK  [x] 7 mål på nytt (likt, beholdt)  [ ] 8 modellsjekk (26 nye kort siden 21.10 < 40, ikke kjørt)
