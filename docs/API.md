# Euro-Trade Shop-API

Eigene Artikel per Programm anlegen, ändern, abrufen und löschen.
Basis-URL: `https://euro-trade.com/api/v1`

## Schlüssel

Admin → **System → Shop-API** → Name eingeben → **Schlüssel anlegen**. Der Schlüssel (`et_…`) wird **nur einmal** angezeigt – sofort sicher ablegen. Widerrufen geht dort jederzeit.

Jeder Aufruf schickt ihn im Header:

```
Authorization: Bearer et_…
```
(alternativ `X-Api-Key: et_…`)

## Grundregeln

- Zuordnung immer über die **`sku`** (Artikelnummer). Gibt es die SKU schon als eigenen Artikel → **Update**, sonst → **Neuanlage**.
- **Neue Artikel sind Entwurf** (ausgeblendet), bis `"hidden": false` gesendet wird.
- Updates sind **Teil-Updates**: nur die mitgeschickten Felder ändern sich.
- **Katalogartikel des Lieferanten** (L-Shop) sind über die API weder änderbar noch löschbar.
- **Bild-URLs** (`https://…`) werden in den Shop kopiert (kein Hotlinking). Erlaubt: PNG, JPG, WebP bis 15 MB. Mit `?mirror_images=0` bleibt die URL unverändert.
- Bis zu **500 Artikel** pro Aufruf. `?dry_run=1` prüft nur, ohne zu speichern.

## Artikel anlegen oder ändern – `POST /api/v1/artikel`

Body: ein Artikel, ein Array oder `{ "items": [ … ] }`.

```bash
curl -X POST https://euro-trade.com/api/v1/artikel \
  -H "Authorization: Bearer $ET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "ET-POL-051-TS",
    "name": "Mein neuer Spruch – T-Shirt Politik Satire",
    "category": "T-Shirts",
    "collection": "satire",
    "brand": "Euro-Trade",
    "basePrice": 3.14,
    "fixedGross": 24.90,
    "short": "Kurzbeschreibung für die Einleitung.",
    "description": "Ausführliche Produktbeschreibung.",
    "slug": "mein-neuer-spruch-t-shirt",
    "seo": { "title": "Mein neuer Spruch | T-Shirt Politik Satire", "description": "Meta-Beschreibung bis ca. 155 Zeichen." },
    "imageAlt": "Schwarzes T-Shirt mit dem Spruch …",
    "images": ["https://example.com/bilder/mein-neuer-spruch-tshirt.jpg"],
    "colors": [{ "name": "Black", "hex": "#000000" }],
    "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"],
    "material": "Jersey, 145 g/m²",
    "composition": "100 % Baumwolle",
    "gender": "Unisex",
    "features": ["Rundhals", "Doppelnähte"],
    "specs": { "Thema": "Politik & Debatte", "Textilart": "T-Shirt" },
    "tags": ["Satire", "T-Shirt"],
    "pairs": ["ET-POL-051-HD"]
  }'
```

Antwort:
```json
{ "ok": true, "created": 1, "updated": 0, "unchanged": 0, "errors": 0,
  "results": [{ "sku": "ET-POL-051-TS", "status": "created", "id": "a-1a2b3c4d", "hidden": true,
                "url": "https://euro-trade.com/politik-satire/mein-neuer-spruch-t-shirt" }] }
```

Freischalten (Teil-Update):
```bash
curl -X POST https://euro-trade.com/api/v1/artikel -H "Authorization: Bearer $ET_API_KEY" \
  -H "Content-Type: application/json" -d '{ "sku": "ET-POL-051-TS", "hidden": false }'
```

`status` je Artikel: `created`, `updated`, `unchanged` (nichts geändert) oder `error` (mit `error`-Text). Fehler bei einzelnen Artikeln brechen den Rest nicht ab.

### Felder

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `sku` | ja | Artikelnummer, max. 40 Zeichen, eindeutig |
| `name` | bei Neuanlage | Artikelname, max. 120 Zeichen |
| `category` | – | Kategorie (Standard „Sonstiges“); bei `collection` wird die Kollektionsseite genutzt |
| `collection` | – | Eigene Kollektion, z. B. `"satire"` → erscheint unter /politik-satire. `null` entfernt die Zuordnung |
| `hidden` | – | `true` = Entwurf (Standard bei Neuanlage), `false` = sichtbar |
| `basePrice` | – | Einkaufspreis netto (Grundlage der Kalkulation) |
| `fixedGross` | – | Fester Verkaufspreis brutto (ersetzt die Kalkulation, z. B. inkl. Druck) |
| `short` | – | Kurzbeschreibung (Einleitung auf der Artikelseite) |
| `description` | – | Produktbeschreibung |
| `slug` | – | Eigene URL, nur `a-z 0-9 -` |
| `seo.title`, `seo.description` | – | SEO-Titel und Meta-Beschreibung |
| `imageAlt` | – | Alternativtext des Produktbilds |
| `images` | – | Bild-URLs (`https://…`) |
| `colors` | – | `[{ "name": "Black", "hex": "#000000", "image": "https://…" }]` |
| `sizes` | – | Größen als Liste |
| `brand`, `material`, `composition`, `gender` | – | Texte |
| `features`, `tags` | – | Listen (max. 20) |
| `specs` | – | Merkmale `{ "Name": "Wert" }` (max. 30) |
| `pairs` | – | SKUs passender Artikel |
| `baseTiers` | – | Staffel-EK `[{ "min": 10, "price": 2.9 }]` |
| `top` | – | `true` = als Top-Artikel markieren |

## Abrufen – `GET /api/v1/artikel`

```bash
# ein Artikel
curl -H "Authorization: Bearer $ET_API_KEY" "https://euro-trade.com/api/v1/artikel?sku=ET-POL-051-TS"
# Liste (nur eigene Artikel, mit Suche, seitenweise)
curl -H "Authorization: Bearer $ET_API_KEY" "https://euro-trade.com/api/v1/artikel?custom=1&q=hoodie&limit=100&offset=0"
# alle Artikel einer Kollektion
curl -H "Authorization: Bearer $ET_API_KEY" "https://euro-trade.com/api/v1/artikel?collection=satire"
```

## Löschen – `DELETE /api/v1/artikel?sku=…`

```bash
curl -X DELETE -H "Authorization: Bearer $ET_API_KEY" "https://euro-trade.com/api/v1/artikel?sku=ET-POL-051-TS"
```
Nur eigene Artikel. Zum vorübergehenden Ausblenden lieber `POST` mit `"hidden": true`.

## Fehlercodes

| Code | Bedeutung |
|---|---|
| 401 | Kein oder ungültiger Schlüssel |
| 400 | Body leer/ungültig, mehr als 500 Artikel, oder alle Artikel fehlerhaft |
| 404 | Artikel nicht gefunden (GET/DELETE) |
| 200 | Erfolgreich – bei Teilfehlern `ok: false` und Details in `results` |
