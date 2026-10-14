# Funn fra gjennomganger

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
