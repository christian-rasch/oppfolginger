ENDRINGER KLARE – si «push» til Claude for å publisere
Gjennomgang 17.10.2026 (build 2026-10-17-126). Første automatiske kjøring.

Treff på NYE kort (9 ekte nye etter 15.10, merket blindt): appen selv 8 av 9 → eval før 9/9 → etter 9/9.
Totalt (142 kort med fasit): riktig dag 141/142 → 142/142, riktig klokkeslett 57/58 → 58/58, 0 kort uten dato som skulle hatt, 0 falske datoer.
Lært klokkeslett: brukt 3 ganger (Haakon 21:00), selgeren beholdt alle 3. Instruksen vokste 266 tegn (nå 15 543).

Hva som er endret (index.html 19 linjer, laering/tester.js 18, laering/fasit.json +12 kort, funn.md, eval-historikk.md):
- «tirsdag neste uke» betyr nå alltid tirsdagen i NESTE kalenderuke (AI leste det av og til som «neste tirsdag» = én uke senere). Instruks + sikkerhetsnett i koden.
- Datoer skrevet «06.10» / «05.12.2026» leses ikke lenger som klokkeslett 06:10 / 05:12.
- «19;00» (semikolon) godtas som 19:00.
- 12 nye kort lagt i fasiten. Også med: små rettinger i laering/README og kjøreskriptet fra 16.10 (ikke committet da).

Kort som bør rettes manuelt (står fortsatt feil, samme liste som 15.10 – ingen er rettet):
- Haakon: «Ringe februar. Eier begge husene…» (09.10) → uten dato, skal være 1. feb 2027. «Ringe i mars…» (17.09) → uten dato, skal være 1. mars 2027. «Ringe i februar… gi tilbud 1. februar» og «Ringe 1 februar» (16./17.09) → står 2026 (forfalt), skal være 1. feb 2027. «…ringe 21» (15.09) → står 21. sep, skulle vært kl 21 samme dag (nå forfalt – kan lukkes).
- Nicolai: «Ring ila uka…» ×2 (28.09) → står 4./5. okt, skulle vært torsdag 1. okt (forfalt – kan lukkes).
- Eskil: «Ringe neste uke» og «Komme tilbake neste uke» (17./18.09) → uten dato, skulle vært mandag 21. sep (forfalt – kan lukkes).

Spørsmål til Christian (svar i neste økt):
1. Joshua skrev «Ring oå» (15.10) og satte selv mandag 19.10 kl 15. Betyr «oå» «på» (ring på døra) eller «nå»? Fasiten står som usikker til du svarer.
2. To kort laget etter publiseringen 15.10 kom fra GAMMEL app-versjon (109): Jørgen 15.10 og du selv 16.10. Åpne appen på nytt på de telefonene og se at den oppdaterer seg – ellers får de ikke de nye reglene.

Sjekkliste: [x] 2 signaler/stille feil  [x] 3 blind merking (12 kort)  [x] 4 nullpunkt  [x] 5 mønstre med bevis  [x] 6 endringer + tester OK + syntaks OK  [x] 7 mål på nytt (forbedring beholdt)  [ ] 8 modellsjekk (hoppet over: ~12 nye kort siden 14.10, krever 40)
