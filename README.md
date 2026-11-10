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
Ohne API-Key laufen Demo-Daten (`npm run demo-data` erzeugt sie neu).

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
