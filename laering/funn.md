# Funn fra gjennomganger

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
