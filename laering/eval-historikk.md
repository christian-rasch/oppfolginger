# Eval-historikk (datotolkning på ekte notater)
Rader til og med 17.10.2026 har UTC-tid (2 timer bak norsk tid); fra nå norsk tid.

| Når | Modell | Innsats | Kort | Riktig dag | Eksakt | Ga ingen dato (feil) | Median tid | Tokens inn/ut |
|---|---|---|---|---|---|---|---|---|
| 2026-10-14 22:18 | claude-sonnet-5-5 | medium | 80 | 84% | 68% | 1 | 2357 ms | 614452/23285 |
| 2026-10-14 22:22 | claude-sonnet-5-5 | medium | 50 | 92% | 72% | 0 | 2839 ms | 383884/15116 |
| 2026-10-14 22:22 | claude-haiku-5-5 | medium | 50 | 74% | 60% | 9 | 4790 ms | 383884/46747 |
| 2026-10-14 22:22 | claude-opus-5-5 | medium | 50 | 92% | 76% | 0 | 4928 ms | 383884/23048 |
| 2026-10-14 22:22 | claude-sonnet-5-5 | low | 50 | 92% | 72% | 0 | 2587 ms | 383884/14906 |

## Mot fasit (laering/fasit.json), fra 15.10.2026

| Når | Modell | Innsats | Kort | Rå: dag | Kjede: dag | Kjede: eksakt | Ingen-dato-feil | Falsk dato | Median | Tokens inn/ut | Cache-treff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-14 22:53 | claude-sonnet-5-5 | medium | 157 | 94% | 93% | 97% (65) | 8 | 1 | 2266 ms | 38095/45803 | 97% |
| 2026-10-14 22:56 | claude-sonnet-5-5 | medium | 157 | 100% | 100% | 97% (65) | 0 | 0 | 2297 ms | 38095/45404 | 97% |

## Mot fasit (laering/fasit.json), fra 15.10.2026

| Når | Modell | Innsats | Kort | Rå: dag | Kjede: dag | Kjede: eksakt | Ingen-dato-feil | Falsk dato | Nye kort: dag | Median | Tokens inn/ut | Cache-treff |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-17 07:38 | claude-sonnet-5-5 | medium | 142 | 99% | 99% | 98% (58) | 0 | 0 | 9/9 | 2192 ms | 33874/37647 | 97% |
| 2026-10-17 07:43 | claude-sonnet-5-5 | medium | 142 | 100% | 100% | 100% (58) | 0 | 0 | 9/9 | 2263 ms | 33874/37340 | 97% |
| 2026-10-21 09:35 | claude-sonnet-5-5 | medium | 187 | 99% | 98% | 99% (68) | 0 | 2 | 52/54 | 2232 ms | 43861/45175 | 97% |
| 2026-10-21 09:39 | claude-sonnet-5-5 | medium | 183 | 99% | 98% | 100% (64) | 0 | 2 | 49/51 | 2284 ms | 42999/43345 | 97% |
| 2026-10-21 09:41 | claude-sonnet-5-5 | medium | 183 | 98% | 99% | 100% (64) | 1 | 0 | 50/51 | 2262 ms | 42999/43955 | 97% |
| 2026-10-21 09:43 | claude-sonnet-5-5 | medium | 183 | 98% | 98% | 98% (64) | 1 | 0 | 50/51 | 2291 ms | 42999/43762 | 97% |
| 2026-10-21 09:54 | claude-sonnet-5-5 | medium | 183 | 98% | 99% | 100% (64) | 1 | 0 | 50/51 | 2272 ms | 42999/43527 | 97% |
| 2026-10-21 09:54 | claude-haiku-5-5 | medium | 183 | 90% | 97% | 98% (64) | 1 | 2 | 48/51 | 4204 ms | 42999/154928 | 97% |
| 2026-10-21 09:54 | claude-opus-5-5 | medium | 183 | 100% | 100% | 100% (64) | 0 | 0 | 51/51 | 4626 ms | 42999/70491 | 97% |
| 2026-10-21 09:54 | claude-sonnet-5-5 | low | 183 | 98% | 99% | 100% (64) | 1 | 0 | 50/51 | 2254 ms | 42999/42524 | 97% |
| 2026-10-21 09:58 | claude-sonnet-5-5 | medium | 183 | 99% | 99% | 100% (64) | 0 | 0 | 51/51 | 2278 ms | 42999/44176 | 97% |

Rader 21.10.2026: 09:35 = gammel eval med UTC-feil (187 kort, 4 av dem senere usikre); 09:39 = nullpunkt build 130 med
korrigert tid; 09:41/09:43/09:54 (sonnet medium) = vaktene i build 131, før JSON-fiksen («ingen dato 1» = dobbel JSON på
«Komme tilbke»); 09:54 = modellsjekk; 09:58 = endelig build 131. Se funn.md.
| 2026-10-24 09:37 | claude-sonnet-5-5 | medium | 166 | 99% | 100% | 100% (68) | 0 | 0 | 19/19 | 2278 ms | 39530/41335 | 97% |
| 2026-10-24 09:41 | claude-sonnet-5-5 | medium | 166 | 99% | 99% | 100% (68) | 0 | 0 | 19/19 | 2336 ms | 39530/42340 | 97% |
| 2026-10-24 09:43 | claude-sonnet-5-5 | medium | 166 | 99% | 99% | 100% (68) | 0 | 0 | 19/19 | 2269 ms | 39530/42314 | 97% |
| 2026-10-24 09:46 | claude-sonnet-5-5 | medium | 166 | 99% | 100% | 100% (68) | 0 | 0 | 19/19 | 2275 ms | 39530/41497 | 97% |

Rader 24.10.2026 (166 kort = 183 minus Christians 17 testkort, pluss 19 nye blindt merkede): 09:37 = nullpunkt build 135; 09:41 og 09:43 =
instruksen uten setningen «samme ukedag + klokkeslett ikke passert = I DAG» (motsier Christians regel 23.10) – eneste bom begge ganger
var Nicolais ustabile «Ring ila neste uke»; 09:46 = kontroll på originalen (traff igjen). Originalen beholdt. Se funn.md.
| 2026-10-27 09:35 | claude-sonnet-5-5 | medium | 163 | 99% | 100% | 100% (67) | 0 | 0 | 7/7 | 2379 ms | 38847/41492 | 97% |
| 2026-10-27 09:38 | claude-sonnet-5-5 | medium | 163 | 99% | 100% | 100% (67) | 0 | 0 | 7/7 | 2364 ms | 38847/40513 | 97% |

Rader 27.10.2026 (163 kort = 156 med fasit fra før + 7 nye blindt merkede; 46 gamle fasit-kort er slettet av selgerne og finnes ikke lenger i eksporten):
09:35 = nullpunkt build 136; 09:38 = build 137 («ring opp <dagord> N» i sikkerhetsnettet). Likt resultat, endringen beholdt. Se funn.md.
| 2026-10-29 19:34 | claude-sonnet-5-5 | medium | 187 | 97% | 98% | 97% (72) | 0 | 2 | 22/24 | 2245 ms | 44273/47868 | 97% |
| 2026-10-29 19:37 | claude-sonnet-5-5 | medium | 187 | 97% | 98% | 97% (72) | 0 | 1 | 23/24 | 2313 ms | 44273/48267 | 97% |
| 2026-10-29 19:39 | claude-sonnet-5-5 | medium | 187 | 97% | 99% | 97% (72) | 0 | 0 | 24/24 | 2271 ms | 44273/47893 | 97% |

Rader 29.10.2026 (skyjobben, første kjøring; 187 kort = 163 fra før + 30 nye blindt merkede minus testkort/endrede notater/slettede): 19:34 = nullpunkt
build 156 (nye 22/24: Herman «betaler 1149» → falsk dato kl 11:49, og Christians «Komme tilbake midt oppe i noe» der fasiten var feil merket);
19:37 = build 157 (pris foran firesifret tall er ikke klokkeslett) → falsk dato 2 → 1; 19:39 = samme build etter at fasiten for «Komme tilbake»
ble rettet til instruksens regel (i dag, nå + 2 t). Endringen beholdt. Se funn.md.
