INGEN ENDRINGER NØDVENDIG – appen (index.html, build 135) er uendret. Bare læringsfiler er oppdatert og committet lokalt.
Gjennomgang 24.10.2026. Tredje automatiske kjøring. Utløser: 17 nye kort, 8 rettelser.

Treff på NYE kort (22 ekte selgerkort merket blindt, 19 brukbare): appen selv 19/19 → eval før 19/19 → etter 19/19.
Totalt (166 kort med fasit, dine testkort holdt utenfor): riktig dag 166/166, riktig klokkeslett 68/68, kort uten dato som skulle hatt: 0, falske datoer: 0. Stille feil: 0.
De 8 rettelsene er personlige valg (Jørgen flyttet fredag → lørdag/onsdag, 1. jan → 7. jan; Haakon ga kunder ekstra dager) eller notater skrevet etter import (Joshua ×2). Ingen tolkningsfeil.
Lært klokkeslett: brukt 12 ganger (Haakon kl 21), 2 rettet bort (17 %, grensen er 30 %). Instruksen er uendret (15 837 tegn).

Hva som er endret (git diff --stat: fasit.json +22 kort, tester.js +10 tester, eval-historikk.md, funn.md, rapport):
- fasit.json: 22 nye kort fått fasit (1 usikker: Haakons «Ringe neste mandag»).
- tester.js: 10 nye tester fra ekte kort (f.eks. «mandag 1600», «neste fredag» skrevet torsdag, «sendt 1197» er pris). 162 tester OK, syntaks OK.
- Prøvd men IKKE beholdt: fjerne setningen i instruksen som sier «samme ukedag + klokkeslett som ikke er passert = i dag» (motsier regelen din fra 23.10; koden overstyrer uansett). Målingen falt fra 166 til 165 på ett gammelt, ustabilt kort, så originalen står.

Kort som bør rettes manuelt: ingen.

Spørsmål til Christian (svar i neste økt):
1. Haakon skrev «Ringe neste mandag» en torsdag (22.10). AI satte mandag 26.10 og Haakon beholdt det. Instruksen sier egentlig «neste mandag» = mandagen etter førstkommende, altså 2.11. Hva mener selgerne: mandagen i neste uke (26.10) eller 2.11?
2. Instruksen inneholder fortsatt «samme ukedag + klokkeslett = i dag», som du snudde 23.10. Koden gjør +7 uansett, så det er ufarlig. Skal jeg fjerne setningen uten å kreve en bedre måling (målingen klarer ikke skille så liten endring fra støy)?
3. Jørgen skrev «ring i januar/februar» og flyttet fra 1. januar (helligdag) til 7. januar. Skal «januar» alene bety første virkedag etter nyttår i stedet for den 1.? (Bare ett kort, ingen regel ennå.)

Sjekkliste: [x] 2 signaler/stille feil  [x] 3 blind merking (22 kort, 1 usikker)  [x] 4 nullpunkt (100 %)  [x] 5 mønstre med bevis (ingen fikk regel)  [x] 6 tester + syntaks OK (ryddeforsøk i instruksen)  [x] 7 mål på nytt (3 kjøringer, original beholdt)  [ ] 8 modellsjekk (19 nye kort < 40, ikke kjørt)
