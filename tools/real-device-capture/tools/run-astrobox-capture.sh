#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ASTROBOX_BIN="/Applications/AstroBox.app/Contents/MacOS/AstroBox-ng"
STAMP="$(date '+%Y%m%d-%H%M%S')"
OUT_DIR="$PROJECT_ROOT/tools/real-device-capture/out"
LOG_FILE="$OUT_DIR/astrobox-capture-$STAMP.log"
RECOVERED_DIR="$OUT_DIR/recovered-$STAMP"

if [[ ! -x "$ASTROBOX_BIN" ]]; then
  echo "AstroBox executable not found: $ASTROBOX_BIN" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
echo "AstroBox capture log: $LOG_FILE"
echo "Keep this terminal open. Close AstroBox after the band shows 已导出."

set +e
"$ASTROBOX_BIN" 2>&1 | tee "$LOG_FILE"
astrobox_status="${PIPESTATUS[0]}"
set -e

if grep -q 'BMT_CAPTURE_FRAME ' "$LOG_FILE"; then
  node "$SCRIPT_DIR/recover-export.mjs" \
    --input "$LOG_FILE" \
    --out "$RECOVERED_DIR"
  echo "Recovered capture: $RECOVERED_DIR"
else
  echo "No BMT capture frames were received. Log kept at: $LOG_FILE" >&2
fi

exit "$astrobox_status"
