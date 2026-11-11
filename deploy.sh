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

# 4) Sicherung vor dem Update, dann neuesten Stand aus Git holen
[ -d data ] && bash scripts/backup.sh 2>/dev/null || true
CADDY_BEFORE=$(md5sum Caddyfile 2>/dev/null | cut -d' ' -f1)
if [ -d .git ]; then git pull --ff-only; fi
# Ohne L-Shop-API: Katalog aus dem Repo (seed/products.json) verwenden – erst NACH dem Pull kopieren
if ! grep -qE '^LSHOP_API_KEY=.+' .env; then cp seed/products.json data/products.json; fi

# 5) Bauen & starten
docker compose up -d --build
# Caddyfile geändert? Dann Caddy neu erstellen (Datei ist einzeln eingebunden – ein Reload sieht die neue Datei nicht)
if [ "$CADDY_BEFORE" != "$(md5sum Caddyfile | cut -d' ' -f1)" ]; then docker compose up -d --force-recreate caddy; fi
docker image prune -f >/dev/null

# 6) Nächtlicher L-Shop-Sync (03:00) – wird nur einmal eingetragen
CRON="0 3 * * * cd $(pwd) && docker compose exec -T shop node scripts/sync-lshop.mjs >> $(pwd)/data/sync.log 2>&1"
BACKUP="30 2 * * * cd $(pwd) && bash scripts/backup.sh >> $(pwd)/data/backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'scripts/sync-lshop.mjs' | grep -v 'scripts/backup.sh' ; echo "$CRON" ; echo "$BACKUP" ) | crontab -

echo
echo ">> Fertig. Status:"
docker compose ps
echo ">> Logs ansehen:   docker compose logs -f shop"
echo ">> L-Shop-Sync:    docker compose exec shop node scripts/sync-lshop.mjs"
echo ">> Sicherungen:    ls -lh /opt/euro-trade-backups  (täglich 02:30, letzte 30)"
