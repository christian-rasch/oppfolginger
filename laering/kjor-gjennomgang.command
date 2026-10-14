#!/bin/zsh
# Automatisk læringsgjennomgang – startes av launchd daglig 09:30, men gjør bare noe hver 14. dag.
# Dataene hentes av appen selv: Chrome åpner appen (der Christian allerede er innlogget) med ?laering=1,
# appen laster ned en anonymisert fil til ~/Downloads, og dette skriptet flytter den til laering/data/.
cd "$HOME/Desktop/Claude Prosjekt 1/oppfolginger-github-pakke" || exit 1
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
STEMPEL="laering/.sist-kjort"
NAA=$(date +%s)
if [[ -f "$STEMPEL" ]]; then
  SIST=$(cat "$STEMPEL"); (( NAA - SIST < 14*86400 )) && exit 0
fi
curl -s --max-time 10 https://christian-rasch.github.io/oppfolginger/ >/dev/null 2>&1 || exit 0  # ikke på nett → prøv i morgen
LOGG="laering/gjennomgang.log"
mkdir -p laering/data
echo "===== $(date '+%Y-%m-%d %H:%M') gjennomgang starter" >> "$LOGG"
DAG=$(date +%Y-%m-%d)
rm -f "$HOME/Downloads/oppf-laering-$DAG.json" "$HOME/Downloads/oppf-laering-$DAG ("*").json" 2>/dev/null
open -a "Google Chrome" "https://christian-rasch.github.io/oppfolginger/?laering=1&_v=$NAA"
VENTET=0
while [[ ! -f "$HOME/Downloads/oppf-laering-$DAG.json" && $VENTET -lt 90 ]]; do sleep 3; VENTET=$((VENTET+3)); done
osascript -e 'tell application "Google Chrome" to close (every tab of every window whose URL contains "laering=1")' >/dev/null 2>&1
if [[ ! -f "$HOME/Downloads/oppf-laering-$DAG.json" ]]; then
  echo "fikk ingen datafil (ikke innlogget i Chrome?)" >> "$LOGG"
  osascript -e 'display notification "Fikk ikke hentet data – er du innlogget i appen i Chrome?" with title "Oppfølginger: læringsgjennomgang"' 2>/dev/null
  exit 1
fi
mv "$HOME/Downloads/oppf-laering-$DAG.json" "laering/data/laering-$DAG.json"
echo "data: laering/data/laering-$DAG.json" >> "$LOGG"
claude -p "$(cat laering/gjennomgang-prompt.md)" \
  --output-format text \
  --effort high \
  --disallowedTools "mcp__playwright__*,mcp__claude-in-chrome__*,WebFetch,WebSearch" \
  --allowedTools "Read,Write,Edit,Glob,Grep,Bash(node:*),Bash(git add:*),Bash(git commit:*),Bash(git status:*),Bash(git diff:*),Bash(git log:*),Bash(cat:*),Bash(date:*),Bash(sed:*),Bash(python3:*)" \
  >> "$LOGG" 2>&1
echo "===== $(date '+%Y-%m-%d %H:%M') ferdig (exit $?)" >> "$LOGG"
echo "$NAA" > "$STEMPEL"
FORSTE=$(head -1 laering/rapport-siste.md 2>/dev/null)
osascript -e "display notification \"${FORSTE//\"/}\" with title \"Oppfølginger: læringsgjennomgang\"" 2>/dev/null
