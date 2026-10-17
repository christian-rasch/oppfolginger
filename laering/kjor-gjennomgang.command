#!/bin/zsh
# Læringsjobb for Oppfølginger – startes av launchd daglig 09:30.
#  Hver dag (gratis, uten Claude): hent ferske data via appen i Chrome og tell læringssignaler.
#  Full gjennomgang (Claude, effort high) BARE når det finnes noe å lære av – men aldri oftere enn hver 3. dag
#  og aldri sjeldnere enn hver 28. dag. Terskler: ≥12 nye AI-kort, eller ≥3 selgerrettelser, eller ≥1 stille feil,
#  eller ≥2 nye kort uten dato med tidsord.
#  launchd starter IKKE dette skriptet direkte: macOS nekter zsh fra launchd å lese Skrivebord/Nedlastinger (TCC,
#  «Operation not permitted», feilkode 127). Derfor starter launchd appen ~/Applications/Oppfolginger-laering.app
#  (laget med osacompile), som kjører skriptet. Appen må få tilgang til Skrivebord, Nedlastinger og Chrome én gang.
cd "$HOME/Desktop/Claude Prosjekt 1/oppfolginger-github-pakke" || exit 1
setopt null_glob   # tomme jokertegn gir tom liste, ikke feil
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
LOGG="laering/gjennomgang.log"; STEMPEL="laering/.sist-kjort"; LAAS="laering/.laas"; FORSOK="laering/.forsok"
NAA=$(date +%s); DAG=$(date +%Y-%m-%d)
mkdir -p laering/data
[[ -f laering/.bare-signal ]] && BARE_SIGNAL=1   # testflagg: stopp før Claude (slett fila etterpå)
varsle(){ osascript -e "display notification \"${1//\"/}\" with title \"Oppfølginger: læring\"" >/dev/null 2>&1; }
# lås: ikke to kjøringer samtidig (Macen kan våkne og starte dobbelt)
if [[ -f "$LAAS" ]] && (( NAA - $(cat "$LAAS") < 3*3600 )); then exit 0; fi
echo "$NAA" > "$LAAS"; trap 'rm -f "$LAAS"' EXIT
curl -s --max-time 10 https://christian-rasch.github.io/oppfolginger/ >/dev/null 2>&1 || exit 0  # ikke på nett → i morgen

# ---- 1) daglig datahenting via appen (innlogget Chrome) ----
rm -f "$HOME"/Downloads/oppf-laering-*.json 2>/dev/null
open -g -a "Google Chrome" "https://christian-rasch.github.io/oppfolginger/?laering=1&_v=$NAA"
nyfil(){ local f=("$HOME"/Downloads/oppf-laering-*.json(Nom)); print -r -- "${f[1]}"; }   # (Nom): ingen treff = tom streng, nyeste først. «ls -t» uten treff listet prosjektmappa og ga «laering» 17.10 → ventet ikke på nedlastingen
VENTET=0; while [[ -z "$(nyfil)" && $VENTET -lt 90 ]]; do sleep 3; VENTET=$((VENTET+3)); done
osascript -e 'tell application "Google Chrome" to close (every tab of every window whose URL contains "laering=1")' >/dev/null 2>&1
if [[ -z "$(nyfil)" ]]; then
  echo "$DAG: fikk ingen datafil (ikke innlogget i Chrome?)" >> "$LOGG"; varsle "Fikk ikke hentet data – er du innlogget i appen i Chrome?"; exit 1
fi
F=$(nyfil); [[ -f "$F" ]] || { echo "$DAG: datafila er borte ($F)" >> "$LOGG"; exit 1; }
mv "$F" "laering/data/laering-$DAG.json"
ls -t laering/data/laering-*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null   # behold de 10 siste

# ---- 2) tell læringssignaler (uten Claude) ----
SIG=$(node laering/eval.mjs --bare-data --json 2>>"$LOGG") || { echo "$DAG: eval --bare-data feilet" >> "$LOGG"; exit 1; }
les(){ printf '%s' "$SIG" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);const v=process.argv[1].split(".").reduce((o,k)=>o&&o[k],j);console.log(v==null?0:v);})' "$1"; }
NYE=$(les signal.nye); RETTET=$(les signal.nyeRettet); STILLE=$(les signal.nyeStilleFeil); UTEN=$(les signal.nyeUtenDatoMedTidsord)
SIST=0; [[ -f "$STEMPEL" ]] && SIST=$(cat "$STEMPEL"); DAGER_SIDEN=$(( (NAA - SIST) / 86400 ))
echo "$DAG: nye=$NYE rettet=$RETTET stille=$STILLE utenDato=$UTEN dagerSiden=$DAGER_SIDEN" >> "$LOGG"
GRUNN=""
(( NYE >= 12 )) && GRUNN="$NYE nye kort"
(( RETTET >= 3 )) && GRUNN="${GRUNN:+$GRUNN, }$RETTET rettelser"
(( STILLE >= 1 )) && GRUNN="${GRUNN:+$GRUNN, }$STILLE stille feil"
(( UTEN >= 2 )) && GRUNN="${GRUNN:+$GRUNN, }$UTEN uten dato"
(( DAGER_SIDEN >= 28 )) && GRUNN="${GRUNN:+$GRUNN, }28 dager siden sist"
if [[ -n "$BARE_SIGNAL" ]]; then echo "signal: nye=$NYE rettet=$RETTET stille=$STILLE utenDato=$UTEN grunn='${GRUNN:-ingen}'"; exit 0; fi  # test: BARE_SIGNAL=1 zsh laering/kjor-gjennomgang.command
if [[ -z "$GRUNN" ]] || (( DAGER_SIDEN < 3 )); then exit 0; fi   # ingenting å lære av ennå

# ---- 3) full gjennomgang med Claude ----
echo "===== $(date '+%Y-%m-%d %H:%M') gjennomgang starter ($GRUNN)" >> "$LOGG"
cp laering/rapport-siste.md laering/.rapport-forrige.md 2>/dev/null
claude -p "$(cat laering/gjennomgang-prompt.md)

Utløst av: $GRUNN. Forrige gjennomgang: $( [[ $SIST -gt 0 ]] && date -r "$SIST" '+%Y-%m-%d' || echo 'aldri' )." \
  --output-format text \
  --effort high \
  --disallowedTools "mcp__playwright__*,mcp__claude-in-chrome__*,WebFetch,WebSearch" \
  --allowedTools "Read,Write,Edit,Glob,Grep,Bash(node:*),Bash(git add:*),Bash(git commit:*),Bash(git status:*),Bash(git diff:*),Bash(git log:*),Bash(git checkout -- index.html),Bash(cat:*),Bash(date:*),Bash(sed:*),Bash(python3:*)" \
  >> "$LOGG" 2>&1 &
CPID=$!
( sleep 5400; kill "$CPID" 2>/dev/null ) >/dev/null 2>&1 & VAKT=$!   # vakthund: maks 90 min (lukket stdout, ellers henger appen)
wait "$CPID"; EXIT=$?; pkill -P "$VAKT" 2>/dev/null; kill "$VAKT" 2>/dev/null
echo "===== $(date '+%Y-%m-%d %H:%M') ferdig (exit $EXIT)" >> "$LOGG"
# vellykket = exit 0 OG rapporten er skrevet i dag
if (( EXIT == 0 )) && [[ -f laering/rapport-siste.md ]] && [[ "$(date -r laering/rapport-siste.md +%Y-%m-%d)" == "$DAG" ]]; then
  echo "$NAA" > "$STEMPEL"; rm -f "$FORSOK"
  varsle "$(head -1 laering/rapport-siste.md)"
else
  N=$(( $(cat "$FORSOK" 2>/dev/null || echo 0) + 1 )); echo "$N" > "$FORSOK"
  if (( N >= 3 )); then echo "$NAA" > "$STEMPEL"; rm -f "$FORSOK"; varsle "Gjennomgangen feilet 3 ganger – se laering/gjennomgang.log"; else varsle "Gjennomgangen ble ikke fullført (forsøk $N av 3) – prøver igjen i morgen"; fi
fi
