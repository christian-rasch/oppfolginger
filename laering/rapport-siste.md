ENDRINGER KLARE – si «push» til Claude for å publisere (build 2026-10-29-158, ligger på grenen laering/2026-10-29).
Gjennomgang 29.10.2026 – første kjøring i skyen. Utløser: 18 nye AI-kort og 6 rettelser siden 27.10.

Treff på NYE kort (30 merket blindt, 24 brukbare): før 22/24 → etter 24/24.
Totalt (187 kort med fasit, dine testkort holdt utenfor): riktig dag 98 % → 99 %, riktig klokkeslett 70/72, kort uten dato som skulle hatt: 0, falske datoer: 2 → 0.
Feilen som ble funnet: en pris ble lest som klokkeslett. Herman skrev «Interessert betaler 1149 + Viaplay» uten noen tid – appen ga likevel i morgen kl 11:49. Haakon har samme mønster («totalt 1700», «for 2100»).
De 6 rettelsene er bare klokkeslett (Herman 5, Haakon 1, Joshua 1 – samme dag, egen foretrukket tid). Ingen tolkningsfeil på dag.
Lært klokkeslett: brukt 13 ganger, 3 rettet bort (23 %, grensen er 30 %). Instruksen er uendret (16 625 tegn).

Hva som er endret (git diff --stat: index.html +2/−1, sw.js 1 linje, fasit.json +30 kort, tester.js +5 linjer, eval-historikk.md, funn.md, rapport):
- index.html: et firesifret tall rett etter «betaler/totalt/pris/tilbud/sendt/spart/for/over» er en pris, ikke et klokkeslett. «Ringe i morgen 1430» virker som før.
- fasit.json: 30 nye kort har fått fasit (2 testkort, 1 usikker). tester.js: 7 nye tester, 235 OK, syntaks OK.

Fart: AI-svar median 3,3 s på nye kort, skjematid median 15 s. Herman er tregest (AI 4,6 s, skjema 21 s) – han retter klokkeslett på nesten hvert kort.

Kort som bør rettes manuelt:
- Nicolai: «Ring Mai 2027» står på lørdag 1. mai 2027 – riktig er mandag 3. mai 2027 kl 12 (din regel fra 28.10).

Spørsmål til Christian:
1. John: «Kom tilbake innen torsdag» (skrevet tirsdag kveld). Skal det bety torsdag, eller dagen før (onsdag) så han rekker fristen? Jeg har satt torsdag.

Sjekkliste: [x] 2 signaler  [x] 2b fart  [x] 3 blind merking  [x] 4 nullpunkt  [x] 5 mønstre  [x] 6 endring + tester  [x] 7 mål på nytt (beholdt)  [ ] 8 modellsjekk (36 nye < 40)
