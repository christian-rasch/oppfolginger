# HANDOFF — lim hele denne filen inn i en ny ChatGPT-chat

## A. Instruks til ny ChatGPT-chat
- Dette er en **overlevering fra en tidligere, treg ChatGPT-chat**.
- Bruk **denne filen som eneste tidligere kontekst**.
- **Ikke** anta terminaltilgang.
- **Ikke** anta filtilgang.
- Du skal hjelpe med **vurdering, QA, planlegging og presise Claude Code-prompts** — ikke kode selv.
- **Svar på norsk.**
- **Ikke** be om den gamle chatten eller lange logger.

## B. Prosjektmappe
`/Users/christian/Desktop/Claude Prosjekt 1/oppfolginger-github-pakke`

## C. Hovedfil
`index.html` (hele appen — HTML, CSS, JS — ligger der).

## D. Prosjektoppsummering
- Lokal **HTML/CSS/JS-app** for oppfølginger/kunder/feltselgere (dørsalg).
- **Mørk pixel/neon-stil.**
- Endringer gjøres **direkte i `index.html`**.
- **Claude Code i terminal** gjør de faktiske kodeendringene. **ChatGPT** planlegger/kvalitetssikrer/skriver prompts.

## E. Nåværende produktregler

**Hovedfaner:** Avtaler · Må gjøres · Uten tidspunkt. Hovedfanen **«Alle» er fjernet** (skal ikke tilbake).

**Avtaler-subfaner:** I dag · I morgen · Alle · Forfalte.
- **Avtaler → Alle viser IKKE forfalte** — kun kommende, gruppert: Denne uken · Neste uke · Resten av {måned} · måned for måned. Kun ikke-tomme grupper, ingen tall i overskrifter.
- Forfalte vises under **Forfalte**, samt «Forfalt i dag» i I dag-visningen og «Forfalt / må følges opp nå» i Må gjøres.

**nextAction — gyldige verdier + labels:**
- `null` = Neste handling
- `send_offer` = Husk å send tilbud
- `waiting_reply` = Venter på svar (dropdown-valg: **Tilbud er sendt ✅**)
- `trying_to_reach` = Prøver å nå
- `call` = Ring
- `visit` = Besøk
- `lead` = **🔥Lead** (ikke «Lead🔥»)
- Det skal stå **Husk å send tilbud**, ikke «Send tilbud». **«Tilbud skal sendes»** skal ikke tilbake.

**Checkbox-logikk:**
- `send_offer` → `waiting_reply` + `waitingSince` settes.
- `waiting_reply` → `null` + `waitingSince` nullstilles.
- alle andre → `null`. Angre gjenoppretter både `nextAction` og `waitingSince`.

**waiting_reply-tekst (liten, dempet):** «Tilbud er sendt ✅ · i dag», «… · 1 d siden», «… · 2 d siden», osv.

**Besøkskommentar:** klikkbar/redigerbar direkte, **fast størrelse, 3 linjer**, lang tekst klippes, **ingen «Vis mer»**, **ingen blyant**, kortet vokser ikke permanent.

**Datoblokk:** klikkbar, åpner date-popover; **ingen «Endre»**, **ingen blyant**; «Ingen dato» vises som **«—»**.

**Date-popover:** hurtigvalg Senere i dag · I morgen 13:00 · I morgen 16:00 · egen dato/tid · Ingen dato.
- Hele dato-baren er touchvennlig og **åpner kalenderen** (ikke bare ikonet). **Ingen manuell tasting.**
- **Timer 01–07 kan ikke velges** (kun 00, 08–23). **Minutter kun 00, 15, 45.**

**Dato-/tidvisning:**
- I dag: klokkeslett øverst, «I dag» under. I morgen: «I morgen» øverst, klokkeslett under. Neste/nær uke: ukedag øverst, klokkeslett under. Lengre frem: dato øverst, relativ tekst under.
- Forfalt egen visning: I dag/I går + tid; tidligere denne uken (ukedag + «Denne uken» + «-N d siden»); forrige uke («Forrige uke» + 3-bokstavs ukedag + «-N d siden»); 2/3 uker siden; >4 uker → 3-bokstavs måned + «-N d siden». Forfalt vises rødt.

**DEMO-modus skal IKKE tilbake:** `DEMO=true`, `DEMO_NOW`, stort demo-datasett (~52) er fjernet.

**localStorage-regler:** appen bruker ekte dato og localStorage. `save()` skriver, `load()` leser, `seed()` fyller IKKE inn demo-data. Nøkler: `oppf:index`, `oppf:apikey`. Ikke clear localStorage, ikke slett brukerdata.

> Full status finnes i `PROJECT_STATUS.md` i prosjektmappen.

## F. Hva som er viktigst akkurat nå
- **Bevare kontekst.**
- **Ikke** fortsette utvikling blindt.
- **Første oppgave i ny chat:** kontrollere denne handoffen og lage neste konkrete Claude Code-prompt.

## G. Hva ny ChatGPT-chat IKKE trenger
- Ikke kopier hele den gamle ChatGPT-chatten.
- Ikke kopier lange Claude Code-logger.
- Ikke bruk `/export`.
- Ikke lim inn irrelevante terminalutdrag.
- Ikke last opp gamle skjermbilder som ikke viser nåværende relevant UI/status.

## H. Git- og valideringsstatus
*(faktiske resultater på overleveringstidspunktet — `index.html` er endret, men IKKE committet)*

- **Branch:** `main`
- **Nåværende commit-hash (før checkpoint):** `4ee56c2` (`Første versjon: oppfølginger-feltapp (index.html) + dokumentasjon`)
- **`git status --short`:**
  ```
   M index.html
  ?? HANDOFF_NEXT_CHAT.md
  ?? PROJECT_STATUS.md
  ```
  (alt arbeidet siden første commit ligger **ucommittet** i arbeidskopien)
- **`git diff --stat`:** `index.html | 601 ++++----  (365 insertions(+), 236 deletions(-))`
- **`git diff --name-only`:** `index.html`
- **`git diff --check`:** rent — ingen whitespace-/konfliktfeil.
- **Valideringskommandoer kjørt:** Ingen formelle test/lint/build-kommandoer funnet (ingen `package.json`, `Makefile` eller `README`). Kjørte prosjektets faktiske syntakssjekk (JavaScriptCore: trekk ut script-blokk 2 → `osascript -l JavaScript` + `new Function(src)`).
- **Resultat av validering:** **SYNTAKS OK.**
- **Gjenstående risikoer:**
  - Alt arbeid er ucommittet → bør tas **checkpoint-commit** (kun etter eksplisitt beskjed fra Christian).
  - Ingen automatisert UI-/headless-test i miljøet (Node/puppeteer ikke tilgjengelig); visuell QA gjøres manuelt i nettleser + skjermbilder.
  - `CLAUDE.md` ble oppdatert i denne runden (var utdatert) — sjekk at den fortsatt matcher faktisk tilstand ved neste runde.

## I. Anbefalt første handling i ny ChatGPT-chat
**«Første oppgave er å lese denne handoffen, oppsummere status, peke ut risikoer/uklarheter og lage neste konkrete Claude Code-prompt. Ikke start med kodeendringer før det er gjort.»**
