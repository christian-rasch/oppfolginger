# HANDOFF — lim hele denne filen inn i en ny ChatGPT-chat

## A. Instruks til ny ChatGPT-chat
- Dette er en **overlevering fra en tidligere, treg ChatGPT-chat**.
- Bruk **denne filen som eneste tidligere kontekst**.
- **Ikke** anta terminaltilgang. **Ikke** anta filtilgang.
- Din rolle er **planlegging, QA, og å skrive presise Claude Code-prompts** — **ikke** å kode selv.
- Den faktiske kodingen gjøres av **Claude Code i terminalen** (mot fila `index.html`).
- **Svar på norsk.** Eier er Christian — norsk dørselger, ikke utvikler.
- **Ikke** be om den gamle chatten eller lange logger.
- Første oppgave: les denne, oppsummer status, og foreslå neste konkrete Claude Code-prompt. Ikke start «utvikling» blindt.

## B. Prosjektmappe og fil
- Mappe: `/Users/christian/Desktop/Claude Prosjekt 1/oppfolginger-github-pakke`
- Hovedfil: **`index.html`** (hele appen — HTML, CSS, JS — ligger i én fil). Ingen backend.
- Publisering: GitHub Pages. Endringer rulles ut **når noen pusher til `main`**. (Se `deploy-github-pages.md`/minne for URL og repo.)

## C. Hva appen er
- Lokal HTML/CSS/JS-app for **oppfølginger i dørsalg**.
- Stil: mørk **pixel/neon «premium cockpit»**. Fonter: Schibsted Grotesk + JetBrains Mono.
- Data i **localStorage** (nøkler: `oppf:index`, `oppf:apikey`). Ekte dato (`now()=new Date()`).
- Brukes mest på **iPad 11"** i felt + desktop.
- AI-import finnes (📷 Lim inn skjermbilde → JSON → forhåndsutfylt skjema).

## D. Faste regler (må alltid følges)
- Endringer gjøres **kun i `index.html`**. Ikke separat mockup/ny side.
- **Minste effektive endring** — ikke store omskrivinger uten grunn.
- Behold mørk pixel/neon-stil. Farge-tokens i `:root`:
  `--mint #3DF5C5` (utført/positivt), `--gold #E8C26B` (handling gjenstår),
  `--red #FF5A5F` (kun kritisk/forfalt), `--hair/--hair-2` (kanter), `--ink-*` (tekstnivåer).
  **Aldri rød for normal fremdrift.**
- **Ikke** clear localStorage. **Ikke** slett/reset/migrer/seed ekte brukerdata.
- **Ikke** commit eller push uten **eksplisitt** beskjed fra Christian.
- Base64-bilder (THUMB/FULL/kart) skal aldri skrives på nytt — gjenbrukes via grep.
- **Skal aldri tilbake:** `DEMO=true`, `DEMO_NOW`, stort demo-datasett. `seed()` returnerer tom liste.
- QA etter endring: **syntakssjekk av JS er obligatorisk.** `node` finnes ikke alltid →
  trekk ut siste script-blokk og kjør `osascript -l JavaScript` med `new Function(src)`
  (fanger SyntaxError uten å kjøre koden). Ingen automatisert UI-/headless-test i miljøet → visuell QA gjøres manuelt.

## E. Nåværende UI-/produktstatus (oppdatert)

**Hovedfaner:** `Avtaler` · `Må gjøres` · `Uten tidspunkt`. (Hovedfanen «Alle» er fjernet og skal ikke tilbake.)

**Avtaler-subfaner:** `I dag` · `Alle` · `Forfalte`. (Subfanen «I morgen» er fjernet.)
- `Avtaler → Alle` viser **kun kommende** avtaler (ikke forfalte), gruppert: Denne uken · Neste uke · Resten av {måned} · måned for måned. Kun ikke-tomme grupper, ingen tall i overskrifter.
- Forfalte vises under `Forfalte`; «Forfalt i dag» vises i `I dag`-visningen og i `Må gjøres`.

**nextAction (kortenes «neste handling») — gyldige verdier + labels:**
- `null` = «Neste handling» (knapp som åpner dropdown)
- `send_offer` = «Husk å send tilbud»
- `waiting_reply` = «Venter på svar»
- `trying_to_reach` = «Prøver å nå»
- `call` = «Ring»
- `visit` = «Besøk»
- `lead` = «🔥Bør kontaktes»
- Checkbox-logikk (huk av valgt handling): `send_offer`→`waiting_reply` (+`waitingSince` settes);
  `waiting_reply`→`null` (+`waitingSince` nullstilles); alle andre→`null`. Angre via toast.

**Kortets handlingsområde:** én kompakt rad: handling-chip + (kun ved `waiting_reply`) statusen
«Tilbud sendt …» med klikkbar **check-boks** (ikke ✅-emoji, ikke pil). Tekst: «Tilbud sendt i dag / i går / N d. siden»
der kun «N d.» er rød. Klikk på check-boksen oppdaterer `waitingSince` til nå. **«Logg kontakt» er fjernet fra kortene** (data `sistKontakt`/`kontaktlogg` finnes fortsatt, vises bare ikke).

**Kortnavn:** vises som **kun første fornavn + siste etternavn** (data uendret), mindre/lettere font, én linje med ellipsis. Alder-badge på samme linje.

**Besøkskommentar (på kort):**
- Fast høyde (~84px), plass til **3 synlige linjer**. Ingen «Vis mer», ingen blyantikon.
- **Klikk i boksen = rediger fritekst direkte** (contenteditable). Lagres i vanlig `kommentar`-felt.
- Lite **`+` som hjørneflik** øverst til høyre åpner **hurtigvalg-meny** (2 kolonner, iPad-vennlig, over/oppe-til-høyre). `+` lyser neon-grønt på hover/aktiv.
- Hurtigvalg (quickComment): `📞 Ingen svar` · `📅 Ring tilbake` · `💳 Må sjekke pris.` · `🔥 Skal inn!` · `Fjern`.
- Valgt quickComment lagres i **egne felt** `quickComment` + `quickCommentAt` (aldri limt inn i friteksten). Vises som **inline slate-chip** først i feltet, med tidspunkt i parentes («(i dag)», «(1 d.)», «(2 d.)» …). Fritekst flyter etter chipen. Kun **ett** aktivt quickComment per kort; nytt valg erstatter forrige. `Fjern` fjerner quickComment uten å slette friteksten.

**Datoblokk + dato-popover:** klikk på datoblokken åpner popover. Hurtigvalg:
`I dag om 1t` · `I dag om 2t` · `I dag 21:00` · `I morgen 13:00` · `I morgen 16:00` · `I morgen 21:00` · egen dato/tid · `Ingen dato`.
- Egen dato/tid: dato + time + minutt. Gyldige timer: 00, 08–23 (aldri 01–07). Minutter: 00/15/45.
  **Minuttvelgeren åpner alltid på `00`** (uavhengig av lagret tid; endres ikke før «Sett»).
- «Ingen dato» vises som «—». Ingen manuell tasting i kalender-baren.
- (Merk: skjemaet «Ny/Rediger oppfølging» har egne dato-chips der «Senere i dag» fortsatt finnes — det er en annen UI enn popoveren.)

**«Ny / Rediger oppfølging»-modal:** felt navn/alder/telefon/salgsrunde/adresse, Status (HP/HC/Vula),
«Neste handling» (Mail→`send_offer`, Ring→`call`, Besøk→`visit`), dato (chips + datetime-local), besøkskommentar.
- **Fjernet:** «Sjanse»/stjerner og «Løfte»/«Husk å send tilbud»-knapp.
- **Enter** lagrer (Shift+Enter = linjeskift i kommentar). **Klikk på mørk overlay = lagre.** «Avbryt» lukker uten å lagre. Datofeltet åpner kalender ved klikk hvor som helst.

**Gruppeoverskrifter:** dempet **blågrå/slate** farge (`#9fb6c7`) på Avtaler/Må gjøres-grupper.
`.grp.forfalt` beholder rød; underkategori `.grp.sub` (Uten tidspunkt) beholder dempet stil.

**Forfalte:** egen gruppert visning (I dag/I går/Denne uken/Forrige uke/…/Eldre), rolige farger, «-N d.» kun i Eldre, badge skjult ved 0. «Fjern alle eldre»-knapp på Eldre-overskriften.

## F. Git- og valideringsstatus (på overleveringstidspunktet)
- **Branch:** `main`
- **Siste commit:** `18b9e8a` — «feat: handlingsområde, kortnavn, rediger-modal, besøkskommentar-hurtigvalg»
  (samler alt UI-arbeidet siden `d55b27d`). Arbeidskopi **ren** etter commit.
- **IKKE pushet** ennå → endringene er **ikke** rullet ut til GitHub Pages. Push gjøres kun når Christian sier ifra.
- Validering: JavaScriptCore-syntakssjekk **OK** (node finnes ikke i miljøet).

## G. Rollefordeling / arbeidsrutine
- **ChatGPT** (du): planlegger, QA, lager presise Claude Code-prompts. Koder ikke selv.
- **Claude Code (terminal):** gjør de faktiske endringene i `index.html`, kjører syntakssjekk, viser diff, og venter på eksplisitt beskjed før commit/push.
- Hver runde: tydelig avgrenset mål → Claude Code endrer → syntakssjekk + diff → manuell visuell QA hos Christian → evt. commit etter beskjed.

## H. Hva ny ChatGPT-chat IKKE trenger
- Ikke kopier hele den gamle ChatGPT-chatten eller lange Claude Code-logger. Ikke bruk `/export`.
- Ikke last opp gamle skjermbilder som ikke viser nåværende UI.

## I. Åpne punkter / mulig neste arbeid
- Finpuss av besøkskommentar/quickComment har gått over flere runder — fortsett gjerne forsiktig her hvis Christian ønsker mer.
- Vurder om skjemaets dato-chips («Senere i dag») skal samkjøres med dato-popoverens nye hurtigvalg.
- Når Christian er klar: vurder **push til `main`** for å rulle ut til GitHub Pages.
