# PROJECT STATUS — Oppfølginger (feltapp for dørsalg)

Levende prosjektstatus i repoet. Oppdateres når funksjonalitet endres.

> **Ferskeste UI-status (oppdatert 2026-06-15):** se `HANDOFF_NEXT_CHAT.md` seksjon E. Den gjenspeiler commit `18b9e8a` (handlingsområde, kortnavn, rediger-modal, besøkskommentar-hurtigvalg). Enkelte detaljer lenger ned i dette dokumentet kan være eldre.

---

## A. Kort prosjektbeskrivelse
- Lokal **HTML/CSS/JS-app** for oppfølginger, kunder og feltselgere (dørsalg).
- Hovedfilen er **`index.html`** (alt — HTML, CSS, JS — ligger der). Ingen backend.
- Stil: **mørk pixel/neon-design**.
- Brukes mest på iPad 11" ute i felt, samt desktop. AI-import finnes (📷 Lim inn).

## B. Arbeidsprinsipper
- Ikke separat mockup.
- Ikke ny side.
- Endringer **direkte i `index.html`**.
- Behold mørk pixel/neon-design.
- Små, kontrollerte endringer.
- Ikke clear localStorage.
- Ikke slett ekte brukerdata.
- Ikke commit/push uten eksplisitt beskjed.

## C. Viktig nåværende UI-/produktkontekst
**Hovedfaner:**
- Avtaler
- Må gjøres
- Uten tidspunkt

> Hovedfanen **«Alle» er fjernet** og skal ikke tilbake.

**Avtaler-subfaner:**
- I dag
- Alle
- Forfalte
- (subfanen «I morgen» er fjernet)

**Regel:** **Avtaler → Alle skal IKKE vise forfalte avtaler** — kun kommende, gruppert: Denne uken · Neste uke · Resten av {måned} · deretter måned for måned. Viser kun ikke-tomme grupper, ingen tall i overskrifter. Forfalte vises under **Forfalte** og relevante forfaltvisninger (Avtaler → I dag har egen «Forfalt i dag»-seksjon; Må gjøres har «Forfalt / må følges opp nå»).

**Lagring:** `window.storage` → localStorage-fallback. Nøkler: **`oppf:index`** (oppfølgingene), **`oppf:apikey`** (valgfri AI-nøkkel).

## D. nextAction-system
Hvert kort har én «neste handling». Uten valgt handling vises **«Neste handling»**-knapp som åpner en dropdown. Valgt handling vises som chip med avhukingsboks.

**Gyldige verdier:** `null`, `send_offer`, `waiting_reply`, `trying_to_reach`, `call`, `visit`, `lead`.

**UI-labels:**
- `null` = **Neste handling**
- `send_offer` = **Husk å send tilbud**
- `waiting_reply` = **Venter på svar** / dropdown-valg: **Tilbud er sendt ✅**
- `trying_to_reach` = **Prøver å nå**
- `call` = **Ring**
- `visit` = **Besøk**
- `lead` = **🔥Bør kontaktes**

**Viktige label-regler:**
- Det skal stå **🔥Lead**, ikke «Lead🔥».
- Det skal stå **Husk å send tilbud**, ikke «Send tilbud».
- **«Tilbud skal sendes»** skal ikke komme tilbake.

**Checkbox-logikk (huk av valgt handling):**
- `send_offer` → `waiting_reply` **og `waitingSince` settes**.
- `waiting_reply` → `null` **og `waitingSince` nullstilles**.
- alle andre handlinger → `null`.
- Angre via toast gjenoppretter både `nextAction` og `waitingSince`.

**waiting_reply skal vise liten dempet tekst:**
- Tilbud er sendt ✅ · i dag
- Tilbud er sendt ✅ · 1 d siden
- Tilbud er sendt ✅ · 2 d siden
- osv.

**Sentrale datafelt:** `nextAction`, `waitingSince` (timestamp), `dato` (`YYYY-MM-DDTHH:MM` | null), `kommentar`, `state` (`aktiv`|`fulgt`). `migrate()` utleder `nextAction` fra eldre felt (`handlinger`/`prover`) **én gang**, deretter er `nextAction` kilden.

## E. Besøkskommentar
- Kommentarboksen er **klikkbar/redigerbar direkte** (klikk i boksen → inline tekstfelt; lagrer ved blur / Cmd-Ctrl+Enter, Esc avbryter).
- **Fast størrelse.**
- Viser **3 linjer**.
- Lang tekst **klippes**.
- **«Vis mer» skal ikke finnes.**
- **Blyantikon skal ikke finnes.**
- Redigering kan ha intern scroll, men kortet skal **ikke vokse permanent**.

## F. Datoblokk (venstre på kortet)
- Klikkbar; åpner date-popover.
- Det skal **ikke** stå «Endre».
- **Blyantikon** ved datoblokken skal ikke vises.
- **«Ingen dato» vises som horisontal strek: —**
- Dato-popoveren skal beholdes.

## G. Date-popover
**Hurtigvalg:**
- Senere i dag
- I morgen 13:00
- I morgen 16:00
- egen dato/tid
- Ingen dato

**Regler:**
- Egen dato-bar skal være **touchvennlig** for iPad/feltselgere.
- **Hele dato-baren** skal åpne kalenderen, ikke bare kalenderikonet (`showPicker()` med fallback).
- Man skal **ikke** kunne skrive dato manuelt med tastatur (`inputmode="none"` + blokkert keydown/paste; ikke `readonly`).
- **Timer 01–07 skal ikke kunne velges** (kun 00, 08–23).
- **Minutter skal kun være 00, 15 og 45.**

## H. Dato-/tidvisning (datoblokken)
**Kommende:**
- I dag: klokkeslett øverst, «I dag» under.
- I morgen: «I morgen» øverst, klokkeslett under.
- Neste uke (og nær uke): ukedag øverst, klokkeslett under.
- Resten av måneden / senere måneder: dato øverst, relativ tekst under.

**Forfalt (egen visning):**
- I dag + tidspunkt.
- I går + tidspunkt.
- tidligere denne uken: ukedag, «Denne uken», «-N d siden».
- forrige uke: «Forrige uke», ukedag med tre bokstaver, «-N d siden».
- 2 uker siden / 3 uker siden (+ «-N d siden»).
- mer enn 4 uker: måned med tre bokstaver + «-N d siden».
- Forfalt vises rødt.

## I. DEMO-modus (skal IKKE tilbake)
Tidligere ble det testet et onsdag-demo-oppsett med `DEMO=true`, `DEMO_NOW`, og et stort demo-datasett (~52 oppfølginger). Dette var feil og er fjernet.

Faste regler:
- **`DEMO=true` skal ikke tilbake.**
- **`DEMO_NOW` skal ikke tilbake.**
- **Stort demo-datasett skal ikke tilbake.**
- Appen skal bruke **ekte dato** og **localStorage**.
- `save()` skal **skrive** til localStorage.
- `load()` skal **lese** fra localStorage.
- `seed()` skal **ikke** fylle inn stort demo-datasett (returnerer tom liste).

## J. Fast arbeidsrutine fremover

**Før endringsrunde:**
- Les `PROJECT_STATUS.md` og `HANDOFF_NEXT_CHAT.md`.
- Avklar nøyaktig mål for én liten endringsrunde.
- Ikke gjør store omskrivinger.
- Ikke slett brukerdata.
- Ikke commit før eksplisitt beskjed.

**Etter endringsrunde:**
- Oppsummer endrede filer.
- Oppsummer nøyaktig hva som ble endret.
- Oppdater `PROJECT_STATUS.md` ved behov.
- Oppdater `HANDOFF_NEXT_CHAT.md` ved behov.

**Etter vellykket test:**
- Noter hva som ble testet.
- Noter hva som passerte.
- Noter eventuelle gjenstående feil.
- Vent på eksplisitt beskjed før commit.

**Før ny chat:**
- Oppdater `PROJECT_STATUS.md`.
- Oppdater `HANDOFF_NEXT_CHAT.md`.
- Kjør git status/diff-sjekk.
- Lag checkpoint-commit **kun** etter eksplisitt beskjed.
- Lim `HANDOFF_NEXT_CHAT.md` inn i ny ChatGPT-chat.

**Når starte ny chat:**
- Når ChatGPT-chatten blir merkbart treg.
- Når prosjektstatus har endret seg mye.
- Etter en større fungerende milepæl.
- Før en risikabel ny endringsrunde.
- Når handoffen ikke lenger matcher faktisk prosjektstatus.

## K. QA-status — Fase 1 / Avtaler-filter (AVKLART OG LUKKET)
Read-only QA-runde gjennomført. Status: **grønn — ingen kodeendring nødvendig.**

- Git-status bekreftet: branch `main`, siste commit `78133be`, **ren arbeidskopi**.
- Avtaler-filterlogikken vurdert **grønn**.
- `Avtaler → Alle` viser **kun kommende avtaler**, ikke forfalte.
- `Forfalt i dag` ligger i **I dag-visningen og Må gjøres**, ikke i `Forfalte`.
- **Akse-dekobling** mellom avtaledato og `nextAction` er avklart som **ønsket oppførsel** (samme kort kan vises i handlingsvisning og datovisning samtidig).
- **Må gjøres-telleren** skal inkludere forfalte avtaler **uten** aktiv `nextAction`; tallet kan endre seg når et klokkeslett passerer (ønsket).
- Ingen kodeendring var nødvendig.
