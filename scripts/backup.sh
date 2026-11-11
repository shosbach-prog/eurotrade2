#!/usr/bin/env bash
# Tägliche Sicherung von data/ (Anfragen, Kunden, Artikel-Änderungen, Uploads, Bewertungen …)
# Aufruf: bash scripts/backup.sh   – behält die letzten 30 Sicherungen
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="${BACKUP_DIR:-/opt/euro-trade-backups}"
mkdir -p "$DEST"
FILE="$DEST/data-$(date +%F-%H%M).tar.gz"
tar -czf "$FILE" data
ls -1t "$DEST"/data-*.tar.gz | tail -n +31 | xargs -r rm -f
echo "$(date '+%F %T') Sicherung: $FILE ($(du -h "$FILE" | cut -f1))"
