# Funn fra gjennomganger

## 17.10.2026 – fartstest: hvor går tiden i «Lim inn»-kallet? (12 nyeste kort med bilde, Sonnet 5.5 medium, Mac/wifi)
Målt med strømming (tid til første tegn vs. skrivetid). Typisk kort: 2,3–3,3 s totalt, hvorav ca. 1,2–1,8 s er opplasting + bilde
(566 KB forespørsel) og resten er modellens skriving (ca. 190–300 tokens JSON, ~180 tokens/s).
- **Hovedfunn:** på 3 av 12 kort (alle «nyere kartvisning»/vanskelige) skriver modellen 500–900 tegn **resonnement i prosa før
  JSON-en** (appen kaster den). Disse tar 4,4–6,9 s – nesten dobbelt. Prosaen er ekte tankearbeid: tvinges JSON først
  («foerste tegn SKAL vaere {») faller de til 2,6–3,3 s, men Sundliveien-kortet mistet navn+alder og ett kort flyttet datoen
  én uke. Reordnet JSON (datoGrunn før dato/nextAction) ga «call» i stedet for «waiting_reply» på «Snakke på fredag…»-kortet.
  «Maks to setninger» gjorde at modellen ALLTID skrev to setninger → lette kort +0,7 s, sum verre (37,3 → 39,2 s).
  **Konklusjon: la prompten stå.** Prefill («{» som assistent-start) støttes ikke av modellen (400).
- Hurtigbuffer: treff vs. bom på den faste instruksen (8 179 tokens) ga INGEN målbar tidsforskjell → 1-times TTL hjelper ikke.
- Bilde: 1 280 px/0,65 (228 KB) leste likt som 1 400 px/0,72 (566 KB); 1 000 px leste navnet feil («Wakleby»). Ingen tidsgevinst
  på wifi, men 340 KB mindre å laste opp på mobilnett. Eneste trygge justering, hvis ønsket.
- Innsats low: likt som medium (4,6 vs 4,9 s på samme kort). Strukturert utdata (output_config.format json_schema) virker og
  fjerner prosaen, men første kall tok 4,5 s før første tegn (grammatikk-kompilering) – ikke verdt det.
- Kode: `cloudFetchApiKey` setter `aiWarm=false` selv når nøkkelen er uendret → ping kjøres på nytt ved første «Lim inn»
  per app-start, og analysen venter på den. Liten gevinst (0–0,5 s), kun første kort.

## 17.10.2026 – test: holder pin-STØRRELSE alene for å finne valgt kunde? (104 kort etter 24.09, alle med bilde)
Tre varianter på samme bilder, Sonnet 5.5 medium, kjørt i app-fanen: A = kun «finn den største pinnen, gjengi etiketten»,
B = produksjonsinstruksen (build 126), C = B med kortere pin-avsnitt (uten sentrum-søk og navne-advarsler, 14 877 tegn).
- A fant riktig pin i **101 av 101** vurderbare kort (3 bortfall skyldtes testoppsettet: for lav max_tokens/dobbel JSON).
  Inkludert Christians tre Sundliveien-importer 17.10 der kortet (gammel «nærmest midten»-regel) var FEIL (TOR 73) og A/C riktig (Raymond).
- Modellen sa «én pin er tydelig størst» bare i 46/104 (panel 31/70, ny visning 15/31) – men traff likevel. Størrelsesforskjellen
  er subtil etter komprimering til 1400 px.
- Tid (median): A 1,8 s · B 2,77 s · C 2,71 s → kortere pin-avsnitt gir INGEN målbar tidsgevinst (instruksen er hurtigbufret;
  tiden går til bilde + svar). B vs C like i 92/104; avvikene var datostøy (12:00/13:00, 16:30/17:00) og Sundliveien.
- Sideobservasjon: navn inne i notatet («(NY) Telenor … Finn Eivind Frantzen …») gir tomt navn i ny visning (B og C).
Konklusjon: behold build 127 (størrelse først i begge visninger). Ikke verdt å kutte mer for fartens skyld.

## 17.10.2026 (build 126) – første automatiske gjennomgang
**Utløser:** 65 nye kort, 21 rettelser, 1 stille feil, 28 dager siden sist (aldri kjørt før). NB: «65 nye» er
siden 03.10 (eval teller 14 dager tilbake når `.sist-kjort` mangler) – 56 av dem lå allerede i fasiten da reglene
ble laget 15.10, altså lukket bok. **Ekte nye kort (etter fasiten 15.10 01:17): 12**, 9 brukbare i eval (3 fikk
notatet skrevet etter import), alle merket blindt, 1 usikker («Ring oå»).

**Tall:** 314 kort, 172 med AI, 142 i eval (30 holdt utenfor: notat endret etter import), 42 rettet av selger.
Stille feil: 9 (1 ny: Haakon «Ringe februar» 09.10, laget på gammel build 109) – alle 9 sto også på lista 15.10
og er fortsatt ikke rettet av selgerne. Lært klokkeslett: 3 kort (Haakon, 21:00), 0 rettet bort (regelen holder).
Promptstørrelse 15 277 → 15 543 tegn (+266).

Eval mot fasit (Sonnet 5.5 medium, 142 kort):

| | NYE kort (9, blind) | Kjede: dag | Kjede: eksakt (58 med tid) | Ga ingen dato (feil) | Falsk dato |
|---|---|---|---|---|---|
| Før (build 125) | 9/9 | 141/142 (99 %) | 57/58 | 0 | 0 |
| Etter (build 126) | **9/9** | **142/142 (100 %)** | **58/58** | 0 | 0 |

Ekte treff i appen på de 9 nye: 8/9 – Nicolai «[tlf] Ring tirsdag neste uke» (skrevet torsdag) ble 27.10, selger
rettet til 20.10. I eval svarte AI riktig på det kortet, men bommet i stedet på Jacobs likelydende «Kontakt tirsdag
neste uke» fra 08.10 (også torsdag): mønsteret er ekte, modellen er ustabil på akkurat dette.

**Mønstre med bevis → endret:**
1. **«<ukedag> neste uke»** (7 kort, 6 selgere; 2 bommer: Nicolai 15.10 i appen, Jacob 08.10 i eval). AI leser det
   av og til som «neste <ukedag>» (= førstkommende + 7). Instruks (DAG): «<ukedag> neste uke»/«til uka»/«neste uke
   <ukedag>» = ukedagen i NESTE kalenderuke, med eksempler. Kode: `NEXTWEEK_WD_RE` + `nextWeekWeekday()`; vakt etter
   AI-dato (retter dagen, beholder klokkeslettet) og i sikkerhetsnettet (så «tirsdag neste uke» skrevet mandag ikke
   blir i morgen).
2. **dd.mm-datoer lest som klokkeslett** («06.10», «08.09», «05.12.2026», «11.07.26», «31.12.2027»; 6 kort). Kolon-
   regexen i `timeFromText` gjorde «M1 06.10» til 06:10 (Jacobs kort landet på 20.10 kl 06:10). Nå: punktum + 01–12
   bak = dato; noe etter neste punktum = dd.mm.åå. Alle ekte punktum-klokkeslett i dataene har 00/20/30 bak, så ingen
   rammes («kl 10.10» fanges uansett av kl-regelen).
3. **«19;00»** (Joshua, 1 kort) – semikolon for kolon, åpenbart generell skrivefeil → godtas i samme regex. AI klarte
   det selv denne gangen; sikkerhetsnettet gjør nå det samme.
Tester: 7 klokkeslett-tester, 8 nextWeekWeekday-tester, 9 pipeline-tester lagt til – alle OK. Syntaks OK.

**Selgerrettelser (42 med uendret notat):** 17 tolkningsfeil – ALLE fra build 106–109 (før rettingene 117–123) og
alle treffer nå i eval (imorgen 1200, I morgen etter 18, om to dager, Ringe 1300, Ring 21, 17.00 Imorgen, 25. mars,
17/18 tiden tirsdag, senere i uka, Ring i februar). 10 rene tidsrettelser (Haakon → 21/15; dekket av lært time fra
build 125, 3/3 beholdt siden). 8 personlige valg (dag flyttet uten støtte i notatet). 7 der både AI og kort avviker
(Haakon flytter gjerne «imorgen» én dag ekstra – personlig; «Ringe 9» satt dagen etter – personlig/glipp).

**Bevisst ikke gjort:**
- Rydding av instruksen: ingen regel har vært ubrukt i 3 gjennomganger ennå (dette er den første). To setninger
  sier omtrent det samme om «dag/tid trumfer handling» – kandidat for sammenslåing etter 3 gjennomganger.
- Modellsjekk: ~12 nye kort siden forrige (14.10) < 40.
- 30 kort holdes utenfor eval fordi notatet er endret etter import; 3–4 av dem skiller seg bare i «!!!» eller
  telefon-anonymisering. Kan hentes inn med bedre normalisering i eval.mjs (målestøy, ikke appen) – neste gang.
- «slutten av februar» = 25. (konvensjon i instruksen) – ikke endret, 1 kort.
- «Ring oå» (Joshua) – usikker, spørsmål til Christian.

**Observasjon utenfor læringen:** 2 kort laget ETTER publiseringen av 125 (15.10 01:37) kom fra app-versjon 109:
jorgen.f 15.10 07:14 og christian.rasch 16.10 14:26. En telefon med gammel fane får ikke nye regler før appen laster
på nytt (auto-oppdatereren sjekker bare når fanen er aktiv). Ikke rørt her – bør sjekkes.

**Trend (kjede: dag):** 15.10 før 93 % → 15.10 etter 100 % (lukket bok) → 17.10 før 99 % / etter 100 %. Nye kort
(blind): 9/9 (appen selv: 8/9). Neste gjennomgang: minst 12 nye kort, eller signal.

## 15.10.2026 (build 123) – grunnmuren: fasit, kjede-måling, hurtigbuffer, nye regler
**Tall:** 302 kort, 160 med AI, 54 rettet av selger. Fasit laget for alle 160 (157 brukbare, 3 usikre).
Eval mot fasit (hele kjeden, Sonnet 5.5 medium, 157 kort):

| | Riktig dag | Eksakt tid (65 kort med tid) | Ga ingen dato (feil) | Falsk dato |
|---|---|---|---|---|
| Før (build 121) | 93 % (97 % etter fasit-retting) | 97 % | 8 (2) | 1 |
| Etter (build 123) | **100 %** | 97 % | 0 | 0 |

Forbehold: fasiten og reglene er laget på de samme 157 kortene, så 100 % er «lukket bok». Den ekte testen er
de neste 14 dagene med nye kort (gjennomgangen merker dem og måler på nytt).

**Gjennomgang av alle 160 AI-kort (Claude, ikke bare rettelsene):**
- Sonnet 5.5 + instruksen treffer svært godt. Nesten alle avvik mellom AI og kortets dato er selgerens egne
  valg (flyttet ringing én dag, satte kl 15/21 i stedet for 12). Jacob beholder 12:00, Haakon vil ha 15/21.
- Stille feil (feil dag, ingen rettet): 12 kort. 7 av dem er fra før rettingene 117–121 (årstallsfeil 2020/2025
  fra Sonnet 4.6, «Imrg», «februar»). Ekte nye mønstre: «ila uka» (2 kort, AI ga neste uke/søndag), «ringe 21»
  (AI tolket som 21. september, selger lot det stå), «prøv heller tirsdag» (AI tok mandag), «om en uke».
- Kort som fortsatt står feil hos selgerne (må rettes manuelt): Haakon «Ringe 1 februar» og «gi tilbud 1.
  februar» (står på 2026 → 2027), «Ringe i mars» / «Ringe februar» / «om en uke» / «20ende sep» (uten dato),
  «ringe 21» (står 21. sep). Eskil «Ringe neste uke» + «Komme tilbake neste uke» (uten dato). Joshua «Ring Imrg».

**Endringer i grunnmuren:**
- `normaliserDato(o,ctx)`: hele etterbehandlingen er nå én ren funksjon mellom [[LAER-START]]/[[LAER-END]].
  tester.js og eval.mjs laster den direkte → kode og app testes 1:1. De nye kjede-testene fant to ekte feil med
  en gang: «2026» i «25. mars 2026» ble lest som kl 20:26, og «17/18-tiden» ble ikke gjenkjent som tid.
- Instruksen er delt i fast + dynamisk del; fast del sendes med cache_control (hurtigbuffer). I eval: 97 % av
  inn-tokens fra buffer. I appen gir det samme effekt når en selger limer inn flere kort innen 5 minutter.
  «Naa» står nå sist (rett før svaret) i stedet for øverst.
- fasit.json («Claudes øyne»): gull/tidFri/usikker/merknad per AI-kort. eval.mjs måler rå + kjede mot fasit,
  skiller tid-fri kort, teller ingen-dato-feil og falsk dato, og lister stille feil (--bare-data).
- Nye regler (instruks + kode): «ila uka»/«i løpet av uka»/«senere i uka» = torsdag denne uka; rettelser i
  notatet («heller», «prøvde X», «passet ikke») – siste instruks vinner; «ringe 21» = klokkeslett, aldri dag i
  måneden (kode-vakt når AI likevel gjør det til dato); «om en uke» = 7 dager (var mandag); tilstandsord
  («sliten etter jobb») er ikke tidspunkt; fortids-ukedager («møtte kona torsdag») gir ikke dato; årstall
  (20xx etter månedsnavn/dato) er aldri klokkeslett; «N-tiden», «rundt 13-15», «etter 18» = klokkeslett.
- Gjennomgangs-instruksen (gjennomgang-prompt.md) krever nå: merk nye kort i fasiten FØRST, mål mot fasit før/
  etter, behold bare forbedringer, liste «kort som bør rettes manuelt» i rapporten.

**Bevisst ikke endret:** standardtid 12:00 (lært time dekker selgere med fast mønster); «torsdag eller fredag»
→ første alternativ; modellvalg (Sonnet 5.5 medium, se 14.10).

**Stikkprøve bildelesing (32 nyeste kortbilder, 8 selgere, sett av Claude):** teksten appen leste stemmer med
pinnen på alle 32. Avvik: 1 kort (Joshua «Ring Imrg kveld») hadde INGEN notat på bildet – selgeren skrev det inn
etterpå, så AI-en svarte riktig «ingen dato». Lærdom: eksporten tar nå med teksten AI faktisk leste (ai.kommentar),
og eval holder kort utenfor der notatet er endret etter import. Småting uten betydning for dato: telefon-/navnelinjer
utelates fra notatet (går til egne felt), og «1097» (pris) falt bort i ett notat. Konklusjon: bildelesing trenger
ikke egen automatikk nå.

**Gjennomgang av selve læringssløyfen (build 125):** svakheter funnet og rettet.
- *Kalender → signal.* Jobben henter data daglig (gratis) og kjører full gjennomgang bare når det finnes noe å
  lære av (≥12 nye kort / ≥3 rettelser / ≥1 stille feil / ≥2 nye uten dato), min. 3 og maks 28 dager mellom.
- *Lukket bok.* Treff ble målt på kortene reglene var laget på. Nå måles NYE kort (siden forrige gjennomgang)
  separat og rapporteres først – det er den ekte treffsikkerheten.
- *Forankring.* Claude merket fasit etter å ha sett AI-svaret. Nå: blind merking (notat + «nå» først).
- *Regel på ett kort.* Nå kreves ≥2 forekomster eller et åpenbart generelt mønster. Instruksen skal også ryddes
  (like regler slås sammen, ubrukte forenkles) og størrelsen logges (15 277 tegn nå).
- *Lært klokkeslett uten kontroll.* Kortet husker nå om tiden kom fra lært time; jobben måler hvor ofte selgerne
  retter bort fra den (>30 % = regelen er for aggressiv).
- *Notat endret etter import.* AI så en annen tekst enn den som står på kortet; slike kort holdes utenfor.
- *Menneske i sløyfen.* Rapporten får «Spørsmål til Christian» (usikre notater, maks 5) og sjekkliste.
- *Robusthet.* Lås mot dobbeltkjøring, vakthund 90 min, stempel bare ved vellykket kjøring (ellers 3 forsøk),
  10 siste datafiler beholdes, utløser og forrige dato sendes med til Claude.
- Signal akkurat nå: 64 nye kort siden 30.09, 21 rettet, 3 uten dato m/tidsord, 2 stille feil → første
  automatiske gjennomgang utløses ved første kjøring.

**Neste:** (1) se om 100 % holder på nye kort; (2) eventuelt eksport av kortbilder (siste ~50) så eval også kan måle
bildelesing (OCR) og sammenligne modeller på det – krever endring i laeringEksport().

## 14.10.2026 (build 119) – første gjennomgang, 302 kort / 160 med AI / 57 rettet av selger
Mønstre som bommet, og hva som ble gjort:
- «Ring Imrg», «i mrg», «imorra» → ingen dato. **Fikset:** forkortelser i instruks + kode (117).
- «Ringe februar» / «Ringe i mars» i oktober → AI valgte februar/mars *i år* (passert) → nullet.
  **Fikset:** måned som er passert skyves ett år frem; månedsnavn som sikkerhetsnett (118).
- «Ringe neste uke» → AI skrev årstall 2025/2020 → nullet. **Fikset:** årstallsvakt gjelder nå alle
  relative datoer med feil år (119).
- «Ringe om en uke», «Ringe om to dager» → ingen dato. **Fikset:** «om N dager/uker» i instruks + kode.
- «Ringe søndag 20ende sep» → ingen dato. **Fikset:** ordenstall («20ende», «20de», «den 20») i instruks;
  ukedagen fanges av koden uansett.
- «Ring 21 om ikke svart», «Ringe 9» → ingen dato. **Fikset:** «ring N» = klokkeslett i kode + instruks.
- «Ringe imorgen 1430», «kl 1700», «Ringe 1300» → firesifret tid ble oversett av koden. **Fikset:**
  HHMM-tolkning (unntak 1000/2000/500 ved linje/fiber/kr).
- «Ring Imrg kveld» → kl 12. **Fikset:** tidsord (kveld 21, etter jobb/ettermiddag 17, formiddag 10).
- «Kontakt i 17/18 tiden tirsdag» skrevet tirsdag → AI satte neste tirsdag, selger mente i dag.
  **Fikset:** samme ukedag + klokkeslett som ikke er passert = i dag.
- «Komme tilbake senere i uka» (tirsdag) → AI satte mandag neste uke, selger satte torsdag.
  **Fikset:** regel i instruks.
- Selgerne retter standardtiden 12:00 svært ofte: Haakon → 15:00/21:00, Christian → 16:00/18:00,
  Jacob beholder 12:00. **Fikset:** appen lærer hver selgers vanlige time (`learnedHour`).

Ikke endret (vurdering):
- «Ringe torsdag om ikke» → AI torsdag, selger fredag 21: personlig valg, ikke tolkningsfeil.
- «Kom tilbake torsdag eller fredag» → AI torsdag, selger fredag: begge er riktige.
- Gamle kort fra juni/juli uten `ai`-felt er fra før AI-import og sier ingenting om dagens tolkning.

Neste gjennomgang: se om «Uten tidspunkt»-lista krymper hos Haakon/Joshua, og om de lærte
klokkeslettene stemmer (se etter kort der selger retter *bort fra* den lærte timen).
