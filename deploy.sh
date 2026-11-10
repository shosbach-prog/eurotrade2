#!/usr/bin/env bash
# Euro-Trade Shop – Installation/Update auf einem Linux-Server (Ubuntu/Debian)
# Aufruf im Projektordner:  sudo bash deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

# 1) Docker installieren, falls nicht vorhanden
if ! command -v docker >/dev/null 2>&1; then
  echo ">> Installiere Docker …"
  curl -fsSL https://get.docker.com | sh
fi

# 2) .env anlegen, falls nicht vorhanden
if [ ! -f .env ]; then
  cp .env.example .env
  echo ">> .env aus Vorlage angelegt – bitte SMTP/L-Shop-Daten eintragen: nano .env"
fi

# 3) Datenordner vorbereiten (Container läuft als root, Daten bleiben bei Updates erhalten)
mkdir -p data/anfragen
[ -f data/products.json ] || cp seed/products.demo.json data/products.json  # Demo-Daten bis zum ersten L-Shop-Sync

# 4) Neuesten Stand aus Git holen
if [ -d .git ]; then git pull --ff-only; fi

# 5) Bauen & starten
docker compose up -d --build
docker image prune -f >/dev/null

# 6) Nächtlicher L-Shop-Sync (03:00) – wird nur einmal eingetragen
CRON="0 3 * * * cd $(pwd) && docker compose exec -T shop node scripts/sync-lshop.mjs >> $(pwd)/data/sync.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'scripts/sync-lshop.mjs' ; echo "$CRON" ) | crontab -

echo
echo ">> Fertig. Status:"
docker compose ps
echo ">> Logs ansehen:   docker compose logs -f shop"
echo ">> L-Shop-Sync:    docker compose exec shop node scripts/sync-lshop.mjs"
