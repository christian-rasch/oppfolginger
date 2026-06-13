# CLAUDE.md — varige prosjektregler

Eier: Christian (norsk dørselger, ikke utvikler). **Svar alltid på norsk.**

## Hva prosjektet er
- Lokal **HTML/CSS/JS-app** i én fil: **`index.html`**. Ingen backend.
- Data lagres lokalt (localStorage / `window.storage`).
- Stil: mørk **pixel/neon** «premium cockpit».

## Faste regler (må følges)
- Endringer gjøres **direkte i `index.html`**.
- **Ikke** lag separat mockup, ny side eller parallell prototype.
- **Behold** den mørke pixel/neon-stilen.
- **Minste effektive endring** — ikke store omskrivinger uten grunn. Endre kun det som bestilles.
- **Ikke clear localStorage.**
- **Ikke slett ekte brukerdata.**
- **Ikke commit** uten eksplisitt beskjed fra Christian.
- **Ikke push** uten eksplisitt beskjed fra Christian.
- Base64-bilder (THUMB/FULL/kart) skal **aldri** skrives på nytt — gjenbruk via grep fra eksisterende fil.

## Skal ALDRI tilbake
- `DEMO=true`
- `DEMO_NOW`
- Stort demo-datasett (~52 oppfølginger i `seed()`).

## Skal alltid gjelde
- Appen bruker **ekte dato** (`now()` = `new Date()`) og **localStorage**.
- `save()` skal **skrive** til localStorage.
- `load()` skal **lese** fra localStorage.
- `seed()` skal **ikke** fylle inn stort demo-datasett (returnerer tom liste).

## Rollefordeling
- **Claude Code (terminal)** gjør de faktiske kodeendringene.
- **ChatGPT** brukes som planlegger / kvalitetssikrer / prompt-hjelper — **ikke** som direkte terminalaktør.

## QA etter endring
- **Syntakssjekk** av JS er obligatorisk. `node` er ikke alltid tilgjengelig; bruk da JavaScriptCore:
  trekk ut script-blokk nr. 2 → `osascript -l JavaScript` med `new Function(src)` (fanger `SyntaxError` uten å kjøre koden).
- Oppsummer alltid hvilke filer som ble endret og nøyaktig hva.
- Ingen commit/push før eksplisitt beskjed.

## Visuell stil (tokens i `:root`)
`--mint #3DF5C5` (utført/positivt), `--gold #E8C26B` (handling gjenstår), `--red #FF5A5F` (KUN kritisk/forfalt), `--hair/--hair-2` (kantlinjer), `--ink-*` (tekstnivåer). Fonter: Schibsted Grotesk + JetBrains Mono. Aldri rød for normal fremdrift.

## Mer detaljert status
Se **`PROJECT_STATUS.md`** for full produkt-/UI-status (faner, `nextAction`, datoblokk, dato-popover, kommentarboks osv.) og **`HANDOFF_NEXT_CHAT.md`** for overlevering til ny ChatGPT-chat.

## AI-import (📷 Lim inn) — uendret
Skjermbilde → komprimeres (canvas, maks 1400px, jpeg 0.72, FileReader — aldri blob-URL) → `aiCall()`. Med API-nøkkel: XHR mot api.anthropic.com. Uten nøkkel: fetch via Claude-broen. Prompt returnerer ren JSON.
