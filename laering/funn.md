# Funn fra gjennomganger

## 29.10.2026 (build 157) – første skyjobb: pris lest som klokkeslett
**Utløser:** skyjobben (laering/skyjobb-prompt.md), første kjøring. Ingen rad i `oppf_rapporter` → fallback 14 dager, men «nye kort» er regnet
fra forrige faktiske gjennomgang 27.10 kl 09:38 (eval-historikk), så tallene er sammenlignbare. Signal: 18 nye AI-kort (alle umerket), 6 rettet,
0 stille feil blant nye, 0 uten dato m/tidsord. Data hentet via Supabase (15 selgere, 375 kort, 240 med AI, 1 feilrad i client_log).
NB for skyjobben: telefonmaskering må gjøres i eksport.mjs (JS), ikke i SQL – Postgres-regex matcher annerledes («12345678 Telenor» → «[tlf]Telenor»
uten mellomrom) og da endres md5-ID-en, så gamle fasitkort ser umerkede ut.

**Tall:** 30 kort merket blindt (2 test, 1 usikker: Hermans «Etter klokken …» der tallet er maskert som telefonnummer). Lært time: 13 kort, 3 rettet
bort (23 %, under 30 %). Promptstørrelse uendret (16 625 tegn). Eval (Sonnet 5.5 medium, 187 kort): NYE kort 22/24 → 24/24; kjede dag 98 % → 99 %,
eksakt 97 % (70/72) uendret, ingen-dato-feil 0, falsk dato 2 → 0. Median 2,3 s.

**Mønster med bevis – pris tolket som klokkeslett:** `timeFromText` leste firesifrede priser som hhmm: Herman «Interessert betaler 1149 + Viaplay»
(AI: ingen dato, riktig) → sikkerhetsnettet ga i morgen kl 11:49. Samme mønster i Haakons kort fra august («totalt 1700 med Netflix», «for 2100»,
«Betalte over 1000»), der det kan dra 12:00-etterjusteringen til feil time. **Endring:** ett nytt `continue` i hhmm-løkka når tallet står rett etter
betal-/totalt/pris/tilbud/sendt/spar-/for/over. «til» er bevisst ikke med («hjemme til 1800» kan være tid). 7 nye tester (6 feilet før). 235/235 OK.

**Fasit rettet:** Christians «Komme tilbake midt oppe i noe» ble først blindt merket «ingen dato», men instruksen sier «komme tilbake» uten tid = i dag
nå + 2 t → fasit 28.10 kl 09:00.

**Selgerrettelser (6 nye):** alle beholdt dagen, bare klokkeslett: Herman 5 (10/12 → 13–15, personlig tid; learnedHour tar det når han har ≥3
rettelser fra 12:00), Haakon 1 (lært 21 → 13), Joshua 1 («imr» 12 → 19). Ingen tolkningsfeil.

**Fart (nye 18 kort):** AI median 3,3 s (høyere enn 2,3–2,4 s i eval, som er tekst uten bilde), skjematid median 15 s, 1 svar med prosa (5,5 s),
ingen kalde starter/flere forsøk. Herman skiller seg ut: AI 4,6 s og skjema 21 s (6 kort, retter klokkeslett på nesten alle).

**Bevisst ikke gjort:** modellsjekk (36 nye kort siden 24.10 < 40); ingen instruksendring (modellen traff alle nye kort); ingen regel for «innen torsdag»
(1 kort, spørsmål til Christian); ingen rydding i instruksen (ingen regel har vært ubrukt i 3 gjennomganger som kan måles her).

**Trend (nye kort):** 24.10 19/19 → 27.10 7/7 → 29.10 24/24 (etter endring).


## 28.10.2026 (build 148) – Christians svar, fart-måling, salgsrunde, A/B-plan for mindre bilde
**Svar fra Christian 28.10** (gjelder som regler, ikke spør igjen):
- **«neste <ukedag>» = «<ukedag> neste uke» = ukedagen i FØRSTKOMMENDE uke** (uka som begynner førstkommende mandag).
  Skrevet torsdag 22.10: «neste mandag» = 26.10 (ikke 2.11), «neste fredag» = 30.10 (ikke i morgen 23.10 – stemmer med
  Haakons kort 17:21, fasit 30.10, Haakon godtok). Skrevet søndag 25.10: «neste mandag» = 26.10 (i morgen). Christians ord:
  «mandag neste uke er mandag førstkommende uke». Kode: `NEXTWEEK_WD_RE` fanger nå også «neste <ukedag>», «+7»-grenen i
  sikkerhetsnettet er fjernet, instruksen sier det samme. Fasit: Haakon «Ringe neste mandag» → 26.10 (ikke lenger usikker).
- **Måned alene = første virkedag i måneden** (man–fre, ikke 1.1/1.5/17.5/25.12/26.12; bevegelige helligdager er ikke med):
  «ringe i januar» = mandag 4.1.2027, «Ring Mai 2027» = mandag 3.5.2027. Gjøres deterministisk i `normaliserDato`
  (`foersteVirkedag`), både når AI ga den 1. og i sikkerhetsnettet. IKKE når notatet har dagtall foran måneden («1. februar»),
  eller når dagen kom fra en ukedag/«i morgen». Instruksen sier fortsatt «den 1.» (modellen regner ikke ukedager pålitelig).
  Bindingsregelen (uken før den 1.) er uendret. Fasit: Jørgen «i januar/februar» → 2027-01-04, Nicolai «Ring Mai 2027» → 2027-05-03
  (Nicolais kort står fortsatt på 1. mai → dukker opp som «bør rettes manuelt» i neste rapport; det er riktig).
- **Lært klokkeslett teller også godtatte kort**: `learnedHour()` teller (a) rettet bort fra 12:00 → ny time, (b) BEHOLDT den lærte
  timen → stemme for den, (c) rettet bort fra lært time → ny time (før kunne en lært time aldri avlæres, fordi `ai.dato` er etter
  normalisering og aldri var 12:00 på slike kort). Beholdt 12:00 uten lært time = ingen informasjon. Konsekvens: timen blir
  selvforsterkende; avlæring krever at rettelser overstiger godtatte blant de 40 nyeste. Sikkerhetsventil: `laertTime.selgerRettetTid`
  >30 % i eval (i dag 2 av 12).
- «Fjerne motsigende setning» i instruksen: fortsatt nei (målt 24.10, originalen traff bedre).
Kontroll: 226/226 tester; kjørt gamle mot nye regler på AI-ens råforslag for alle 214 kort i eksporten 27.10 → nøyaktig 2 kort
endrer dato (Nicolai mai, Jørgen januar), ingen andre. Ingen API-eval kjørt (reglene er deterministiske og Christians ord vinner).

**Salgsrunde** (Christian: «A 2» skal bli «Tromsø A2»): nytt promptfelt `salgsrundeLinje` (linja ordrett), og appen regner selv
`salgsrundeFraLinje()` (LAER-blokka, testet): siste stedsnavn + ev. bokstav A–D + tall uten mellomrom («Troms Tromsø A 2» → «Tromsø A2»,
«Agder Lyngdal 2» → «Lyngdal 2», «FTTH Oslo Hoeybraaten 2_Juli_26» → «Hoeybraaten 2»). R1–R5 i linja = Roll uansett modellens status.
Gamle kort med «Troms Tromsø A 2» vises «Tromsø A2» (`shortRunde`) og grupperes sammen med nye. Feltrekkefølgen i JSON er uendret
(omrokkering endret nextAction 17.10). Ingen ekstra AI-kall for salgsrunde (Christians idé om bakgrunnslesing): alt kommer i samme
svar, et ekstra kall = nytt bilde opp (≥1,5 s), kappløp med lagring og dobbel kostnad.

**Fart – måling fra nå av** (Christian vil at selgeren skal kunne lagre raskest mulig; dato/tid først): hvert AI-kort får `ai.ms`
(komp = komprimering, vent = venting på oppvarming, ai = selve kallet, total = fra bilde klart til svar, skjema = fra skjemaet åpnet
til selgeren lagret, forsok, prosa = tegn før JSON, tegn, kald), `ai.tok` (inn/ut/cache/cacheSkriv) og `ai.bilde` (px, kb). Ingen
personopplysninger. Admin-lista viser «AI median … · skjema median …» pr. selger (30 d). `eval.mjs --bare-data` har `fart`-blokk
(totalt, nye, pr. selger, pr. bildestørrelse); gjennomgangen har nytt steg 2b «Fart». Forventning (fra 17.10): typisk 2,3–3,3 s der
1,2–1,8 s er opplasting på wifi; på 4G/iPad mini er opplastingen den største posten. Oppvarmings-fiks: `cloudFetchApiKey` nullstilte
`aiWarm` ved hver synlighet selv om nøkkelen var uendret → unødig ekstra ping (0–0,5 s); nå bare ved ny nøkkel.

**A/B-test av mindre bilde – beslutningsregel skrevet FØR kjøring:** `laering/bilde-ab.js` (kjøres i innlogget admin-fane) sender
hvert kort med bilde fra siste 14 dager gjennom samme kall to ganger: A = 1400 px/0,72 (som i dag), B = 1280 px/0,65 (re-kodet fra
lagret A → dobbel komprimering, dvs. konservativ test). Avvik + 10 tilfeldige kort kjøres en gang til; «ekte» forskjell bare når
A1==A2 og B1==B2 og A1≠B1, ellers støy; A1-mot-A2 er grunnlinja. **Bytt til 1280/0,65 (`AI_IMG_MAX`/`AI_IMG_Q` i index.html) bare
hvis ekte = 0 på dag, klokkeslett, handling, navn og alder, og ekte for salgsrunde ≤ grunnlinja.** **Resultat (kjørt 28.10 kl 06:00–06:05, 85 kort fra 15 selgere, 0 feil, 31 kort kjørt to ganger): RØDT – beholder 1400/0,72.**
Like A/B av 85: dag 81, klokkeslett 84, handling 84, navn 83, alder 85, salgsrunde 83, status 81, saksnr 84, adresse 82, kommentar 72.
Ekte forskjeller (A1=A2, B1=B2, A≠B): dag 2, handling 1, navn 2, salgsrunde 1, status 1, saksnr 1, kommentar 7. Grunnlinje (A1≠A2 på de 31):
dag 2, tid 2, status 2, kommentar 3, adresse 1 – modellen flakker altså like mye av seg selv som A og B skiller seg. Retningen går begge veier:
«Ring i april» (Nicolai) fikk B årstall 2026 (årstallsvakta i koden retter det til 2027, så kortet blir likt); «Hjemme tirsdag kl 17» (Christians
testkort) fikk A 20.10 og B 27.10 – men produksjonskjøringen med A-bildet ga også 27.10, så det er støy; «Tlf fredag» fikk A salgsrunde «mai»
(feil) og B «Vevelstad 1» (riktig); Haakons kort fikk B status HP der A ga tomt. Navn: ukjent hvem som hadde rett (verdiene ble ikke lagret).
**Fart: ingen gevinst.** Median A 3,1 s (187 KB) mot B 3,1 s (78 KB), ut-tokens 300 mot 301, cache-treff 82 mot 85. Bildet i dag er ~190 KB,
ikke 566 KB som i 17.10-testen (den brukte et annet bilde) – opplastingen er ikke flaskehalsen på vanlig nett; på svak 4G sparer 110 KB
kanskje 0,1–0,3 s. Konklusjon: ikke verdt noen som helst risiko for lesingen. `AI_IMG_MAX`/`AI_IMG_Q` blir stående på 1400/0,72; to-versjons-
`compress()` beholdes (gratis) i tilfelle en senere test med bedre grunnlag. Rådata: laering/data/bilde-ab-2026-10-28.json (gitignored).
Lærdom for senere fartsarbeid: tiden ligger i modellens svar (~3 s uansett bildestørrelse), ikke i opplastingen – mål `ai.ms` pr. selger først.
`compress()` tegner allerede to versjoner (kortbildet alltid 1400/0,72; AI-bildet styrt av flagget) – ingen atferdsendring før flagget flippes.
Etter et bytte: sammenlign treff på nye kort med `bilde.px`=1280 mot 1400 (steg 2b).

**Ikke gjort (bevisst):** bakgrunnslesing av salgsrunde (se over); JSON-først/omrokkering/prefill/effort low/json_schema (forkastet 17.10);
instruks om første virkedag (modellen regner ikke ukedager; koden gjør det).

## 27.10.2026 (build 137) – fjerde automatiske gjennomgang
**Utløser:** 4 rettelser (6 nye kort). Forrige gjennomgang 24.10 (nullpunkt build 136, aldri målt før nå – 136 endret ikke datologikk).
**Umerkede AI-kort: 9** (Haakon 4, Eskil 2, Joshua 1, Fredrik 1, Christian 1), alle blindt merket. 7 i eval: 1 test (Christians tomme
notat), 1 usikker og uansett utenfor (Eskil «Ringe tirsdag» – AI leste «Ringe tirsdag neste uke» → 3.11, selgeren beholdt 3.11 men
notatet sier nå bare «Ringe tirsdag»; notat endret etter import). Haakons tomme notat (AI riktig «ingen», han satte 26.10 kl 14 selv) er med.

**Tall:** 335 kort (358 sist – selgerne sletter ferdige kort; 46 gamle fasit-kort finnes ikke lenger i eksporten), 214 med AI, 163 i eval
(32 holdt utenfor: notat endret etter import; 18 Christians testkort), 48 rettet av selger totalt. Stille feil: **0**. Lært klokkeslett:
12 kort (alle Haakon, 21:00), 2 rettet bort (17 %) – uendret siden 24.10, ingen nye kort med lært time (Haakons to nye uten tid ligger
>15 dager frem, der brukes lært time bevisst ikke). Promptstørrelse 15 837 tegn (uendret).

Eval mot fasit (Sonnet 5.5 medium, 163 kort):

| | NYE kort (7, blind) | Kjede: dag | Kjede: eksakt (67 med tid) | Ga ingen dato (feil) | Falsk dato |
|---|---|---|---|---|---|
| Nullpunkt build 136 (09:35) | **7/7** | **163/163 (100 %)** | **67/67** | 0 | 0 |
| Etter, build 137 (09:38) | **7/7** | **163/163 (100 %)** | **67/67** | 0 | 0 |

Rå (modellen alene) 161/163 begge ganger – koden retter 2 gamle kort. **Appen selv traff 7/7 på de nye** (riktig dag på alt).

**Selgerrettelser (5 siden 24.10) – ingen tolkningsfeil, alle er klokkeslett:**
- Joshua «Komme tilbake torsdag» 12 → 17; Eskil «Ringe torsdag» 12 → 17; Haakon «Send melding 1. februar» 12 → 13:45 og
  «ringe I sept 2027» 12 → 15. Ingen av notatene sier tid. Haakon «» (tomt notat): AI ingen dato (riktig), han satte dato selv.
- Lært time dekker nå Eskil: med «Ringe torsdag» har han 3 rettelser fra 12:00 til 17:00 (to eldre kort der han også flyttet dagen,
  pluss dette) → `learnedHour()` gir 17 for ham fra nå av, automatisk, uten kodeendring. Joshua har bare 1 (→ ingen lært time ennå).
- Haakons to rettelser er på kort >15 dager frem, der lært time (21) med vilje ikke brukes – og han valgte 13:45/15, ikke 21, så
  grensen er riktig.

**Mønster med bevis → endret (kode i LAER-blokken, instruksen urørt):**
1. **«ring opp <dagord> N» = klokkeslett i sikkerhetsnettet.** Haakon: «Skal svare ja ring opp imorgen 15» (19.10) og «Skal svare ja
   ring opp mandag 15» (24.10) – 2 ekte kort, samme skrivemåte. Modellen traff begge (instruksen sier alt «tall rett etter ring =
   klokkeslett»), men `timeFromText` fant ikke 15 når et dagord sto imellom → hadde AI svart 12:00 eller ingenting, ville kortet
   fått kl 12. Nå godtar «ring N»-regexen et dagord (i morgen/imrg/i dag/i kveld/ukedag) mellom «ring (opp)» og tallet. Vern mot
   dato-tall: tall fulgt av månedsnavn («ring mandag 7 juli», «mandag 26 oktober»), «.», «/» eller «voksen» o.l. er ikke tid; «mandag 50»
   og «fredag 00» faller utenfor 1–23. 11 enkelttester + 11 pipeline-tester fra ekte kort (184 OK). Eval likt før/etter (ingen
   bieffekt på de 163). Syntaks OK.

**Mønstre vurdert – ingen regel (bevis mangler):**
- `learnedHour()` teller bare rettelser bort fra 12:00, ikke kort der selgeren GODTOK den lærte timen. Haakon har nå nøyaktig 3
  tellende rettelser til 21 (grensen) og 9 godtatte lært-time-kort som ikke teller; sletter han ett gammelt kort, faller lært time
  bort. Ikke rørt (ligger utenfor LAER-blokken, eval kan ikke måle det, ingen feil har skjedd ennå). Kandidat hvis Haakon mister
  21:00: la godtatte lært-time-kort telle som stemme.
- Selgere som setter 17:00 på kort uten tid: Joshua 1, Eskil 3 (dekket av lært time nå). Ikke en instruksendring – 12:00 er fortsatt
  riktig standard, lært time tar resten.
- «Akkuratt bundet seg opp ringe I sept 2027»: bindingsord + måned med årstall → modellen og koden tok riktig måned (oppfMonth
  hopper bare over måneder som står rett etter bindingsord). Dokumentert med test.

**Rydding:** ikke gjort. Den motsigende «= I DAG»-setningen i instruksen ble målt 24.10 (3 kjøringer) og beholdt; Christian har ikke
svart på om den skal ut uten måling. Med 7 nye kort er målingen like ustabil på små endringer som sist – prøver ikke igjen før svar.

**Bevisst ikke gjort:** modellsjekk (26 nye kort siden 21.10 < 40); regel for «januar/februar» = første virkedag (fortsatt 1 kort,
ubesvart spørsmål); regel for «neste mandag» skrevet torsdag (1 kort, ubesvart); endring av `learnedHour` (se over).

**Trend (kjede: dag):** 21.10 etter 99 % (182/183) → 24.10 100 % (166/166) → 27.10 100 % (163/163). Nye kort (blind): 51/51 → 19/19 →
7/7. Appen selv på nye selgerkort: 14/14 → 19/19 → 7/7.

## 24.10.2026 (build 135, uendret) – tredje automatiske gjennomgang
**Utløser:** 17 nye kort, 8 rettelser. Forrige gjennomgang 21.10 (nullpunkt for denne er build 135 fra 23.10, som aldri var målt
med eval før nå). **Umerkede AI-kort: 22** (Haakon 10, Jørgen 6, Joshua 4, Fredrik 1, Simon 1 – ingen fra Christian), alle blindt
merket. 19 i eval: 2 holdt utenfor fordi notatet ble skrevet ETTER import (Joshua «Fredag kl 19» og «Ring Imrg tlf to salg» – AI så
tomt notat og svarte riktig «ingen»), 1 usikker (Haakon «Ringe neste mandag» skrevet torsdag, se spørsmål).

**Tall:** 358 kort, 216 med AI, 166 i eval (32 holdt utenfor: notat endret etter import; 17 Christians testkort), 43 rettet av
selger totalt. Stille feil: **0** (de 7 gamle hos Haakon/Eskil har `laStaa`). Lært klokkeslett: 12 kort (alle Haakon, 21:00),
2 rettet bort (17 %, under grensen 30 %): «neste mandag» → 12:00 og «lørdag midt i brann kamp» → 15:00. Promptstørrelse 15 837
tegn (uendret).

Eval mot fasit (Sonnet 5.5 medium, 166 kort):

| | NYE kort (19, blind) | Kjede: dag | Kjede: eksakt (68 med tid) | Ga ingen dato (feil) | Falsk dato |
|---|---|---|---|---|---|
| Nullpunkt build 135 (09:37) | **19/19** | **166/166 (100 %)** | **68/68** | 0 | 0 |
| Instruks uten «= I DAG»-setningen (09:41, 09:43) | 19/19 | 165/166 ×2 | 68/68 | 0 | 0 |
| Kontroll, original igjen (09:46) | 19/19 | 166/166 | 68/68 | 0 | 0 |

Rå (modellen alene) 164/166 i alle fire kjøringer – koden retter 2 gamle kort. **Appen selv traff 19/19 på de nye** (riktig dag
på alt; på det usikre kortet beholdt Haakon dagen AI satte).

**Selgerrettelser (8) – ingen tolkningsfeil:**
- Jørgen 4: «Ring på fredag kl 11:00» → lørdag kl 16; «Ring 16:20» → dagen etter kl 17; «Ring på fredag» → onsdag uka etter;
  «i januar/februar» (AI 1. jan) → 7. jan. Alle flyttet uten støtte i notatet = personlige valg.
- Haakon 3 + 1: «ring opp imorgen om ikke» → to dager senere kl 15 (personlig); «Ring opp lørdag» 21 → 15 og «neste mandag»
  21 → 12 (tidsrettelser bort fra lært time); «Ring opp» uten tid (AI null, riktig) → satte selv fredag kl 15.
- Joshua 2: notatet skrevet etter import (over) – ikke AI-ens feil.

**Mønstre vurdert – ingen fikk regel (bevis mangler):**
- «neste mandag» skrevet torsdag: modellen svarte 26.10 (mandagen i neste uke) selv om instruksen sier førstkommende + 7 (= 2.11),
  og Haakon beholdt 26.10. Instruksens «neste <ukedag>»-konvensjon kan være feil for akkurat denne kombinasjonen (ukedagen
  ligger etter helga). 1 kort → usikker i fasit + spørsmål til Christian. «neste fredag» skrevet torsdag (samme dag, Haakon) gir
  30.10 uansett konvensjon.
- Måned alene = januar → 1. januar er helligdag (Jørgen valgte 7. jan). 1 kort. Kandidat hvis det kommer flere («etter nyttår»
  = 8. januar finnes alt).
- Haakon setter 15:00 på lørdagskort (2 kort 24.10), lært time er 21. Under grensen; `learnedHour` bruker én time per selger.
  Kandidat: lært time per ukedag/helg – bare hvis andelen rettet bort stiger.
- Nye skrivemåter uten betydning for dato: «Blr» (blir), «kontak», «prospects», «brann kamp» (gir ikke klokkeslett – riktig).
- Pris/tall: «1197», «500», «698» ble korrekt ikke lest som klokkeslett (tester lagt til).

**Forsøk på rydding – IKKE beholdt:** instruksen (DAG) sier fortsatt «Samme ukedag som i dag MED et klokkeslett som ennaa ikke
er passert … = I DAG, ikke neste uke», som motsier Christians regel fra 23.10 (koden gjør +7 uansett). Fjernet setningen
(15 837 → 15 691 tegn) og målte to ganger: 165/166 begge ganger, eneste bom Nicolais «Ring ila neste uke» (28.09 – kjent ustabil,
bommet også i 21.10-kjøringene). Kontroll på originalen: 166/166. Originalen 2/2, endringen 0/2 på dét kortet – svakt bevis, men
regelen «behold bare det som ikke er lavere» gjelder → `git checkout -- index.html`. Setningen er ufarlig så lenge koden
overstyrer; spørsmål til Christian om den skal fjernes uten måling. Sammenslåing av de to «dag/tid trumfer handling»-setningene
(kandidat siden 17.10) ble ikke prøvd i dag fordi målingen ikke klarer å skille så små endringer fra støy på ett kort.

**Endringer:** index.html **uendret** (build 135 står). fasit.json +22 kort (252). tester.js +10 pipeline-tester fra ekte kort
(162 OK, ingen kodeendring). eval-historikk 4 rader + note.

**Bevisst ikke gjort:** modellsjekk (19 nye siden 21.10 < 40); regel for «ila neste uke» (fortsatt 1 kort, ren modellstøy);
regel for «neste mandag» (1 kort, venter på Christian); endring av `learnedHour` (17 % rettet bort).

**Trend (kjede: dag):** 17.10 etter 100 % (142) → 21.10 etter 99 % (182/183) → 24.10 100 % (166/166, uten testkort). Nye kort
(blind): 9/9 → 51/51 → 19/19. Appen selv på nye selgerkort: 8/9 → 14/14 → 19/19.

## 23.10.2026 (build 134–135) – Christian snur regelen for samme ukedag med klokkeslett, og gir bindingsregel
Utløser: Christian leste endringene fra 21.10 og sa at «Hjemme tirsdag kl 17» skrevet en tirsdag skal bety NESTE tirsdag.

### Svar fra Christian (gjelder som regel)
- **Et ukedagsnavn er alltid kommende forekomst, aldri i dag – også med klokkeslett.** Mener selgeren i dag, skal han skrive
  «kommer hjem kl 17» (uten ukedag). «Noen ting må selgeren lære seg.» Kode: unntaket fra 17.10 (samme ukedag + tid ikke passert
  = i dag) og vakten fra 21.10 (AI tok +7 → i dag) er fjernet; samme ukedag → alltid +7. Instruksen er uendret – modellen satte
  alt +7 på begge kortene, det var koden som overstyrte. 4 tester snudd, alle OK.
- Konsekvens: Jacobs «Kontakt i 17/18 tiden tirsdag» (13.10 kl 14:12) får fasit 20.10 kl 17, selv om Jacob selv flyttet kortet
  til 13.10 kl 17:15. Christian vet det og vil ha den enkle regelen. Christians testkort «Hjemme tirsdag kl 17» → 27.10 (står riktig).
- **Bare bindingstid, ingenting om oppfølging → uken før bindingen går ut** (build 135). «Binding til mai» → 24. april (uken før
  den 1. i måneden, siden dagen er ukjent); «Binding 20. februar» → 13. februar; «Binding frem til 05.12.2026» → 28. november; uten
  årstall = neste gang måneden kommer; årstall i fortid = ingen dato; er uken før alt passert → i morgen kl 12. Ligger sist i
  fallback-kjeden i normaliserDato (`bindingSlutt`), så «ringe februar», «imorgen», klokkeslett osv. vinner alltid. Instruksen er
  uendret: modellen svarer «ingen» på slike notater (riktig), appen regner ut datoen. I dataene er det bare Christians to testkort
  som er bindings-alene; 3 tester fra 21.10 snudd (de forventet ingen dato), 11 nye. Fasit: de 2 testkortene → 13.02.2027.
- Bevisst ikke gjort: ingen ny instrukstekst (modellen gjør alt dette riktig selv); ingen eval kjørt (API).

## 22.10.2026 (build 133) – svar fra Christian + regel for «i morgen» rett etter midnatt
Utløser: Christian svarte på spørsmålene fra 17.10 og 21.10 i en vanlig økt (ingen automatisk kjøring; signal 22.10: 8 nye, 2 rettet, 0 stille).

### Svar fra Christian (gjelder som regler fremover – still ikke spørsmålene igjen)
- **«I morgen» rett etter midnatt (00:00–04:59) = dagen som kommer**, altså kalenderdagen som nettopp har begynt, ikke dagen etter.
  Bevis: Fredrik «I morgen etter 18» kl 00:12 → satte samme dag; Christian «ring opp imorgen 15» kl 00:35. Kode (normaliserDato):
  når AI har satt kalenderdagen etter og klokka er før 05, trekkes én dag (klokkeslettet beholdes); fallback-stien («imrg» uten dato
  fra AI) bruker +0 dager før kl 05. 6 nye tester i tester.js. Instruksen er uendret (15 837 tegn). Fasit: Fredriks kort ikke
  usikkert lenger (gull 15.09 kl 18); Christians 3 kopier → 20.10 kl 15 (merket test).
- **Et notat som bare er en full dato («03.11.2025») skal gi ingen dato**, slik instruksen alt sier. Fasit: 2 kort → ingen, ikke usikre.
- **Joshuas «Ring oå» = «Ring opp», uten tidspunkt** → ingen dato. Fasit bekreftet.
- **Christians egne kort teller som ekte selgerkort – unntatt når han tester.** Nytt fasit-felt `test: true`: 43 kort merket
  (alle med «test» i merknaden + snarvei-testene 18.–20.10). eval.mjs holder dem utenfor alle tall, og oppdager umerkede
  testkort fra ham selv (tomt notat, kopi av eget notat innen 24 t, ≥3 andre kort fra ham innen ±10 min → `testkort` i utdata).
  Dermed er «nye kort» ekte selgerkort igjen (21.10 var 39 av 58 nye kort tester).
- **De 10 stille feilene: la stå** (7 forfalte hos Haakon/Eskil fra september, 3 av Christians testkort). Nytt fasit-felt
  `laStaa: true` → holdes utenfor «stille feil» og rapportens «bør rettes».

### Bevisst ikke gjort
- Ukedag rett etter midnatt («Ring tirsdag» skrevet tirsdag 00:30 → koden gir +7 dager). Christians svar gjaldt «i morgen»;
  eneste kort er hans eget «Hjemme tirsdag kl 17» (test, og det har klokkeslett → alt dekket av vakten fra 21.10). Ingen regel
  før mønsteret dukker opp hos en selger.
- Ingen eval-måling kjørt (API). Regelen er smal (krever «i morgen»-ord + klokke før 05 + AI på dagen etter) og kodetestet.
  Neste automatiske gjennomgang måler mot build 133 som nullpunkt.

### Ellers
- Spørsmål 4 fra 21.10 (ucommitet innboks-polling fra 20.10): ligger fortsatt ucommitet i index.html sammen med dette (build 133).
  Christian vurderer å gå over til ren LIM INN-snarvei uten opplasting; da trengs ikke pollingen.

## 21.10.2026 (build 131) – andre automatiske gjennomgang
**Utløser:** 29 nye kort (med tidsord), 2 uten dato. Forrige gjennomgang 17.10. **Ekte nye AI-kort uten fasit: 58** –
men 39 av dem er Christians egne snarvei-tester 17.–20.10 (19 tomme notater, 5 kopier av «Mannen roper nei…», 5 kopier
av Haakons «ring opp imorgen 15», osv.). **Kort fra andre selgere: 14** (Nicolai 2, Jørgen 4, Joshua 3, Haakon 5) –
alle blindt merket. 6 usikre (se under).

**Tall:** 363 kort, 221 med AI, 183 i eval (31 holdt utenfor: notat endret etter import), 42 rettet av selger (1 ny:
Joshua «Komme tilbke» 21:05 → 20:00, tidFri). Stille feil: 10 (3 nye – alle Christians tester, se under; de 7 gamle er
uendret siden 15.10). Lært klokkeslett: 5 kort, 0 rettet bort (regelen holder). Promptstørrelse 15 543 → 15 837 tegn
(+294 kom med bruksenhetsnummer-regelen i build 127, ikke datoregler; uendret i denne gjennomgangen).

**Målefeil funnet og rettet (eval.mjs, ikke appen):** `opprettet`/`ai.ts` i eksporten er UTC, men eval leste dem som
norsk tid → «Naa» var 2 timer for tidlig. Det ga feil ukedag for alt skrevet etter kl 22 norsk tid (Christians kort
«22:35–22:58» 19.10 var i virkeligheten tirsdag 00:35–00:58) og feil «passert»-vurdering («Hjemme 1600» kl 16:08 ble
lest som 14:08). Eval og fasit var konsekvent feil sammen, så tidligere 100 % sto seg; 12 gamle kort ble sjekket, 2 måtte
rettes: Haakon «Ringe 9» 08.09 kl 21:17 (= passert → 09.09 kl 21, akkurat det selgeren satte – IKKE personlig valg som
fasiten sa) og Fredrik «I morgen etter 18» skrevet 00:12 (nå usikker). Appen selv har alltid brukt riktig lokal tid.
Første eval-rad 21.10 09:35 i eval-historikk (187 kort) er med den gamle feilen; nullpunktet er raden 09:39.

Eval mot fasit (Sonnet 5.5 medium, 183 kort, korrigert tid):

| | NYE kort (51, blind) | Kjede: dag | Kjede: eksakt (64 med tid) | Ga ingen dato (feil) | Falsk dato |
|---|---|---|---|---|---|
| Før (build 130) | 49/51 (96 %) | 180/183 (98 %) | 64/64 | 0 | 2 |
| Etter, vakter (09:41/09:43/09:54) | 50/51 | 181 / 180 / 181 | 64 / 63 / 64 | 1 / 1 / 1* | **0** |
| Etter, + JSON-fiks (09:58, build 131) | **51/51 (100 %)** | **182/183 (99 %)** | **64/64** | **0** | **0** |

\* «ingen dato» i de tre mellomkjøringene var alltid Joshua «Komme tilbke»: modellen skrev TO JSON-objekter (se funn 3).
Appen selv traff på de nye: **14/14 hos de andre selgerne**, 49/52 totalt – de 3 bommene er Christians tester («Binding
20. februar … sende tilbud» ×2 og «Hjemme tirsdag kl 17»), begge mønstrene rettet. Eneste gjenværende bom: Nicolai «Ring
ila neste uke» (modellen velger torsdag i stedet for mandag neste uke; ustabil, gammelt kort).

**Mønstre med bevis → endret (kode mellom LAER-START/END + én linje i parseAiJson; instruksen urørt):**
1. **Dagens ukedag + klokkeslett som ikke er passert, AI satte +7.** 2 kort: Jacob «Kontakt i 17/18 tiden tirsdag»
   (13.10 14:12, bommet i appen og i eval 09:39) og Christian «Hjemme tirsdag kl 17» (tirsdag 00:58, bommet i appen).
   Instruksen sier allerede «= I DAG»; vakten i koden dekket bare retningen «AI satte i dag → behold». Ny vakt: samme
   ukedag + tid i notatet som ikke er passert + AI-dato = i dag+7 → i dag med notatets klokkeslett. Unntak: «neste
   tirsdag», «tirsdag neste uke», fortidsord («snakket med kona tirsdag»), tid passert.
2. **Bindings-måned i sikkerhetsnettet.** Christian «Binding 20. februar, kun internett i dag, sende tilbud» ×2: AI
   svarte riktig null, men månedsfallbacken i koden tok «februar» → 1. feb 2027 (falsk dato). Instruksen sier at
   «binding til <måned>»/«til <måned>»/«ut <måned>» ikke er oppfølging – nå gjør koden det samme (`oppfMonth`: første
   måned som IKKE står etter binding/bundet/ferdig/til/ut/frem). «Ute av binding februar, ringe desember» → desember;
   «Ringe i februar binding til mars» → februar (som før). 1 unikt notat, men mønsteret er åpenbart generelt (Haakon
   skriver «binding til mai/mars/april» i 8 kort).
3. **To JSON-objekter i AI-svaret.** Joshua «Komme tilbke» ga «ugyldig JSON» i 3 av 5 eval-kjøringer. Direkte test (3
   kall): modellen skriver først ett JSON-objekt, så «Korrigering: Naa er 19:05 …» og et nytt, rettet objekt. Både appen
   (`parseAiJson`) og eval tok fra første «{» til siste «}» → JSON.parse feilet → appen gjorde et NYTT API-kall (inntil 4
   forsøk, nytt bilde opp hver gang = sekunder ekstra for selgeren), eval ga «ingen dato». Fartstesten 17.10 så det samme
   («dobbel JSON») men trodde det var testoppsettet. Ny `sisteJsonObjekt()` (LAER-blokken, testet): ved parse-feil brukes
   det siste komplette objektet (det rettede). Eval gjør nå det samme som appen. Eneste endring utenfor LAER-blokken: én
   linje i `parseAiJson`.
4. Rydding: fortids-regexen som sto inne i sikkerhetsnettet er nå `FORTID_RE` og brukes av begge vaktene.
Tester: 14 pipeline-tester + 5 JSON-tester lagt til (alle OK, 1 sjekker at gammel oppførsel «AI satte i dag» er uendret). Syntaks OK.

**Modellsjekk (≥40 nye kort siden 14.10; 183 kort, korrigert tid, vakter inne, før JSON-fiksen):**

| Modell | Innsats | Kjede: dag | Nye kort | Eksakt | Ingen dato | Falsk | Median |
|---|---|---|---|---|---|---|---|
| Sonnet 5.5 (i dag) | medium | 181/183 (99 %) | 50/51 | 64/64 | 1 (JSON) | 0 | 2 272 ms |
| Sonnet 5.5 | low | 181/183 (99 %) | 50/51 | 64/64 | 1 (JSON) | 0 | 2 254 ms |
| Opus 5.5 | medium | 183/183 (100 %) | 51/51 | 64/64 | 0 | 0 | 4 626 ms |
| Haiku 5.5 | medium | 177/183 (97 %) | 48/51 | 63/64 | 1 | 2 | 4 204 ms |

Opus er +1 prosentpoeng (terskel for bytte: ≥3) og dobbelt så treg; low er like god men ikke 30 % raskere. Haiku er
dårligere rått (90 %) og tregere (skriver 3,5× så mange tokens). **Beholder Sonnet 5.5 medium.** Neste modellsjekk ved
≥40 nye kort etter 21.10.

**Bevisst ikke gjort:**
- «i morgen» rett etter midnatt (Christian ×3 kl 00:35, Fredrik 00:12 – selgeren satte «dagen som kommer», bokstavelig er
  det dagen etter): tvetydig, 2 selgere men bare 4 kort og ett ekte → usikker i fasit + spørsmål til Christian.
- «Ring om en måned» (Jørgen, 1 kort): AI tok den selv (20.11). `daysAheadFromText` kan ikke «måned» – kandidat hvis det
  kommer flere.
- «Ring ila neste uke» (Nicolai 28.09, gammelt kort): modellen svarer vekselvis mandag/torsdag neste uke (bommet i begge
  21.10-kjøringene, traff 17.10). 1 kort, ustabil modell, ingen regel.
- «Kunden er bunnet opp … til juni 2027 ring 2 måneder før» (Jørgen): AI regnet selv ut 1. april 2027. Fasit = det.
- «03.11.2025» alene (Christian-test ×2): instruksen sier full dato m/årstall er systemdato → null; usikker i fasit.
- Rydding av instruksen: 2. automatiske gjennomgang, ingen regel ubrukt i 3 runder ennå. Kandidat fortsatt: to setninger
  om «dag/tid trumfer handling».
- Bildekomprimering 1 280 px/0,65 (fartstest 17.10): fortsatt ikke gjort – ikke en datoregel.

**Trend (kjede: dag):** 17.10 før 99 % / etter 100 % → 21.10 (korrigert tid) før 98 % / etter 99 % (182/183). Nye kort
(blind): 9/9 (17.10) → 49/51 før, 51/51 etter (21.10). Eneste bom er «ila neste uke» (modellstøy, gammelt kort).
Neste gjennomgang: minst 12 nye kort, eller signal. Svar fra Christian på midnatt-spørsmålet avgjør 4 usikre kort.

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
