# Euro-Trade Webshop (Next.js)

Schneller B2B-Textilshop für **euro-trade.com** mit Daten von **L-Shop**.

- Suche oben mit Live-Vorschlägen, **tippfehlertolerant** (hoddie → Hoodie, T-Schirt → T-Shirt, jutebeutl → Jutebeutel), Umlaute egal (mütze = muetze), Synonyme (Pulli → Sweatshirt, Kappe → Cap), Artikelnummer-Direkttreffer
- Kategorien, Produktseite mit Farbe/Größe/Menge
- Warenkorb → **Anfrage per E-Mail** (an euch + Bestätigung an Kunden), zusätzlich gespeichert in `data/anfragen/`
- Verkaufspreis = L-Shop-EK + Aufschlag % (global oder je Kategorie). Der EK verlässt nie den Server.

## Lokal starten
```bash
cp .env.example .env      # Werte eintragen
npm install
npm run dev               # http://localhost:3000
```
Ohne API-Key kommt der Katalog aus `seed/products.json`. Neue Artikel: gespeicherte L-Shop-Produktseiten (.html) in `import/` legen → `npm run import-html` → Preise optional in `seed/preise.csv` (`AQ010;6,85`).

## Händler-Feed von L-Shop (CSV / XML / JSON)
```bash
npm run import-feed -- /pfad/lshop-feed.csv          # -> data/products.json (live, ohne Neustart)
npm run import-feed -- /pfad/lshop-feed.csv --seed   # -> seed/products.json (ins Repo)
```
Auf dem Server: Datei nach `/opt/euro-trade-shop/data/` kopieren und
`docker compose exec shop node scripts/import-feed.mjs data/lshop-feed.csv` ausführen.
Erkannt werden u. a. Artikelnummer, Bezeichnung, Marke, Warengruppe, Farbe, Farbcode, Größe, EK, Preis_10/Preis_50 (Staffel-EK),
Bestand, Bild, Farbbild. Abweichende Spaltennamen in `scripts/feed-lib.mjs` → `mapItem()` ergänzen.

## L-Shop anbinden (sobald der API-Key da ist)
1. In `.env`: `LSHOP_API_URL`, `LSHOP_API_KEY`, ggf. `LSHOP_AUTH_MODE` (header | x-api-key | query)
2. `npm run sync` – schreibt `data/products.json`. Der laufende Shop lädt die neuen Daten automatisch (kein Neustart).
3. Falls die Felder anders heißen: nur `mapItem()` in `scripts/sync-lshop.mjs` anpassen. Bei 0 Treffern gibt das Script einen Beispiel-Datensatz aus.
4. Nächtlich aktualisieren (Cron auf dem Server):
   `0 3 * * * cd /opt/euro-trade-shop && docker compose exec -T shop node scripts/sync-lshop.mjs`

## Live auf euro-trade.com (Docker + Git)
Server: IONOS VPS 217.154.80.227 (Ubuntu), Firewall: Ports 22/80/443 offen.
DNS: A-Record `@` und `www` → 217.154.80.227

**Erstinstallation auf dem Server**
```bash
ssh root@217.154.80.227
apt-get update && apt-get install -y git
git clone https://github.com/DEIN-NAME/euro-trade-shop.git /opt/euro-trade-shop
cd /opt/euro-trade-shop
cp .env.example .env && nano .env
bash deploy.sh
```

**Update** (nach jedem `git push`):
```bash
ssh root@217.154.80.227 "cd /opt/euro-trade-shop && bash deploy.sh"
```
`deploy.sh` holt den neuesten Stand (git pull), baut neu und startet. `.env` und `data/` (Produkte, Anfragen) liegen nicht im Repo und bleiben erhalten.

**Logs:** `docker compose logs -f shop` · **Sync manuell:** `docker compose exec shop node scripts/sync-lshop.mjs` (läuft zusätzlich jede Nacht 03:00)

## Vor dem Livegang
- Datenschutz in `app/datenschutz` eintragen (Impressum ist fertig)
- SMTP-Zugang in `.env` (sonst nur Speicherung in `data/anfragen/`)

## Automatisches Deployment (Push = live)
Einmalig auf dem Server einen Schlüssel nur für GitHub erzeugen und erlauben:
```bash
ssh root@217.154.80.227
ssh-keygen -t ed25519 -N "" -f ~/.ssh/github-deploy -C github-actions
cat ~/.ssh/github-deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github-deploy        # privaten Schlüssel komplett kopieren
```
GitHub → Repo **eurotrade2** → Settings → Secrets and variables → Actions → *New repository secret*:
- `DEPLOY_HOST` = `217.154.80.227`
- `DEPLOY_SSH_KEY` = der kopierte private Schlüssel (inkl. `-----BEGIN …` / `-----END …`)

Ab dann reicht `git push` – GitHub startet `deploy.sh` auf dem Server (Reiter *Actions* zeigt den Verlauf).

## Sicherung außer Haus (z. B. Hetzner Storage Box)
```bash
ssh root@217.154.80.227
ssh-keygen -t ed25519 -N "" -f /root/.ssh/euro-trade-backup
cat /root/.ssh/euro-trade-backup.pub | ssh -p 23 uXXXXXX@uXXXXXX.your-storagebox.de install-ssh-key
ssh -p 23 -i /root/.ssh/euro-trade-backup uXXXXXX@uXXXXXX.your-storagebox.de mkdir euro-trade
```
In `.env`: `BACKUP_REMOTE=uXXXXXX@uXXXXXX.your-storagebox.de:euro-trade` und `BACKUP_SSH_PORT=23`.
Die nächtliche Sicherung (02:30) spiegelt dann die letzten 30 Sicherungen dorthin. Test: `bash scripts/backup.sh`.
