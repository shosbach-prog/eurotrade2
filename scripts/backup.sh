#!/usr/bin/env bash
# Tägliche Sicherung von data/ (Anfragen, Kunden, Artikel-Änderungen, Uploads, Motive, Bewertungen …)
# Aufruf: bash scripts/backup.sh   – behält die letzten 30 Sicherungen
# Optional außer Haus: in .env  BACKUP_REMOTE=u123456@u123456.your-storagebox.de:euro-trade  (+ BACKUP_SSH_PORT=23)
#   → der Sicherungsordner wird per rsync gespiegelt (z. B. Hetzner Storage Box). SSH-Schlüssel siehe README.
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="${BACKUP_DIR:-/opt/euro-trade-backups}"
mkdir -p "$DEST"
FILE="$DEST/data-$(date +%F-%H%M).tar.gz"
tar -czf "$FILE" data
ls -1t "$DEST"/data-*.tar.gz | tail -n +31 | xargs -r rm -f
echo "$(date '+%F %T') Sicherung: $FILE ($(du -h "$FILE" | cut -f1))"

envval() { { grep -E "^$1=" .env 2>/dev/null || true; } | tail -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"; }
REMOTE="${BACKUP_REMOTE:-$(envval BACKUP_REMOTE)}"
PORT="${BACKUP_SSH_PORT:-$(envval BACKUP_SSH_PORT)}"; PORT="${PORT:-22}"
if [ -n "$REMOTE" ]; then
  command -v rsync >/dev/null 2>&1 || { apt-get install -y rsync >/dev/null 2>&1 || true; }
  KEY="${BACKUP_SSH_KEY:-/root/.ssh/euro-trade-backup}"
  SSH="ssh -p $PORT -o BatchMode=yes -o StrictHostKeyChecking=accept-new"; [ -f "$KEY" ] && SSH="$SSH -i $KEY"
  if rsync -a --delete -e "$SSH" "$DEST/" "$REMOTE/"; then echo "$(date '+%F %T') Außer-Haus-Kopie: $REMOTE ok"
  else echo "$(date '+%F %T') FEHLER Außer-Haus-Kopie nach $REMOTE" >&2; fi
fi
