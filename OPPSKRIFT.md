# Få Oppfølginger på egen adresse (GitHub Pages) — ca. 10 min

1. Gå til **github.com** → opprett gratis konto.
2. Trykk **+** → **New repository** → navn: `oppfolginger` → **Public** → **Create repository**.
3. Trykk lenken **«uploading an existing file»** → dra inn `index.html` fra denne pakken → **Commit changes**.
4. **Settings → Pages** → under «Branch»: velg `main` → **Save**.
5. Vent 1–2 min. Adressen din blir: `https://DITTBRUKERNAVN.github.io/oppfolginger/`
6. Åpne adressen i Safari på iPaden → **Del-knappen → Legg til på Hjem-skjerm**.
7. I appen: **📷 Lim inn → API-nøkkel** → lim inn → **Lagre**. (Én gang — huskes for alltid.)

## Hvorfor dette løser alt
- Ingen mellomlag: AI-kallene går rett til api.anthropic.com → bildeimporten virker.
- Fast adresse: oppfølginger + nøkkel **overlever alle oppdateringer**.
- Oppdatering senere: erstatt `index.html` i repoet (manuelt eller med Claude Code).

## Personvern
Repoet inneholder appen og **ingen nøkkel**. OBS (31.10.2026): mappa `laering/` har læringsdata med ekte kundenotater – skal flyttes ut av repoet (egen plan). Kort og bilder lagres lokalt på iPaden + i skyen (Supabase).

## Adresser og speil (fra 31.10.2026)
Appen finnes på to adresser som viser **nøyaktig samme fil**:
- **Ny (offisiell):** `https://oppfolginger.snodriv.no/` – gis til nye selgere. Alltid med `https://`.
- **Gammel:** `https://christian-rasch.github.io/oppfolginger/` – rulles ut av GitHub Pages direkte. Rør aldri Pages-innstillingene
  på hovedrepoet, og sett aldri eget domene der (da videresendes github.io og alle gamle ikoner mister lager/innlogging/varsler).

Slik henger det sammen: ved hver push til `main` kopierer `.github/workflows/speil.yml` kun `index.html`, `sw.js` og
`apple-touch-icon.png` til speil-repoet **Snodriv/oppfolginger-app**, som GitHub Pages viser under den nye adressen.
Jobben venter inntil 12 min og feiler rødt (e-post fra GitHub) hvis ny adresse ikke viser samme `app-build`. Kjør på nytt:
Actions → «Speil til oppfolginger.snodriv.no» → Run workflow. Dagsrapporten i appen (Rapporter) varsler også hvis adressene er ulike.

**Aldri rør (ellers mister alle på ny adresse lager, innlogging og push):** speil-repoet `Snodriv/oppfolginger-app` må ikke
slettes; domenet må ikke fjernes under Settings → Pages der; deploy-nøkkelen på speilet og secret `SPEIL_DEPLOY_KEY` på hovedrepoet
må ikke regenereres; DNS-postene hos Webhuset (TXT `_github-pages-challenge-snodriv` og CNAME `oppfolginger` → `snodriv.github.io`)
må ikke ryddes bort; **snodriv.no må fornyes** (første fornyelse ca. 16.12.2026 via Webhuset); GitHub-kontoen bør ha 2-trinns innlogging.

**Selgere:** ingen trenger å gjøre noe – gamle ikoner virker og oppdateres som før. Aldri begge ikonene på samme enhet (to
«enheter» i synken + doble varsler). Frivillig bytte: i gammel app vent til «Synket» og alle bilder er lastet opp → IKKE «Logg ut»
(logger ut alle enheter) → installer fra ny adresse → logg inn → slå på varsler → Test-varsel → slett gammelt ikon → bytt snarvei
(«Lag oppfølging» åpner gammel adresse; ny variant åpner `webapp://oppfolginger.snodriv.no/`).
