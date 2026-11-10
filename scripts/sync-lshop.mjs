// L-Shop -> data/products.json
// Aufruf: npm run sync   (per Cron z. B. nachts: 0 3 * * * cd /app && npm run sync)
//
// Sobald der API-Key + die Doku von L-Shop da sind, muss i. d. R. nur mapItem() unten
// angepasst werden. Alles andere (Suche, Preise, Shop) bleibt unverändert.
import fs from 'node:fs';
import path from 'node:path';

// .env laden (ohne extra Abhängigkeit)
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const { LSHOP_API_URL, LSHOP_API_KEY, LSHOP_AUTH_MODE = 'header' } = process.env;
if (!LSHOP_API_URL || !LSHOP_API_KEY) {
  console.error('LSHOP_API_URL und LSHOP_API_KEY in .env setzen. Bis dahin laufen Demo-Daten.');
  process.exit(1);
}

const slug = (s) => String(s).toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const num = (v) => (v == null || v === '' ? undefined : Number(String(v).replace(/\./g, (m, i, s) => (s.includes(',') ? '' : m)).replace(',', '.')));

/** Erstes vorhandenes Feld aus einer Liste möglicher Feldnamen (auch verschachtelt "a.b") */
function get(o, keys) {
  for (const k of keys) {
    const v = k.split('.').reduce((x, p) => (x == null ? x : x[p]), o);
    if (v != null && v !== '') return v;
  }
}

// ---------- HIER AN DIE L-SHOP-DOKU ANPASSEN ----------
function mapItem(raw) {
  const parent = get(raw, ['articleNumber', 'artikelnummer', 'article_no', 'parentSku', 'model', 'styleCode', 'sku', 'id']);
  return {
    parent: String(parent),
    sku: String(get(raw, ['sku', 'variantSku', 'ean', 'artikelnummer', 'id']) ?? parent),
    name: get(raw, ['name', 'title', 'bezeichnung', 'productName', 'description_short']) ?? String(parent),
    brand: get(raw, ['brand', 'marke', 'manufacturer', 'hersteller', 'brand.name']) ?? '',
    category: get(raw, ['category', 'kategorie', 'productGroup', 'warengruppe', 'category.name']) ?? 'Sonstiges',
    description: get(raw, ['description', 'beschreibung', 'longDescription', 'text']) ?? '',
    material: get(raw, ['material', 'composition', 'zusammensetzung']),
    gender: get(raw, ['gender', 'geschlecht', 'target']),
    price: num(get(raw, ['price', 'preis', 'netPrice', 'ekPreis', 'purchasePrice', 'prices.0.price'])),
    image: get(raw, ['image', 'imageUrl', 'bild', 'images.0', 'images.0.url', 'picture']),
    images: get(raw, ['images']),
    color: get(raw, ['color', 'farbe', 'colorName', 'color.name']),
    colorHex: get(raw, ['colorHex', 'hex', 'color.hex', 'rgb']),
    colorImage: get(raw, ['colorImage', 'variantImage']),
    size: get(raw, ['size', 'groesse', 'größe', 'sizeName']),
    sizes: get(raw, ['sizes', 'groessen']),
    colors: get(raw, ['colors', 'farben']),
    stock: num(get(raw, ['stock', 'bestand', 'lagerbestand', 'availability', 'qty'])),
  };
}
// ------------------------------------------------------

async function fetchPage(page) {
  const url = new URL(LSHOP_API_URL);
  if (page > 1) url.searchParams.set('page', String(page));
  const headers = { Accept: 'application/json' };
  if (LSHOP_AUTH_MODE === 'header') headers.Authorization = `Bearer ${LSHOP_API_KEY}`;
  if (LSHOP_AUTH_MODE === 'x-api-key') headers['x-api-key'] = LSHOP_API_KEY;
  if (LSHOP_AUTH_MODE === 'query') url.searchParams.set('apikey', LSHOP_API_KEY);
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`L-Shop API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const items = Array.isArray(json) ? json : json.products ?? json.items ?? json.data ?? json.articles ?? [];
  const more = json.next || json.nextPage || (json.meta && json.meta.current_page < json.meta.last_page) || (json.totalPages && page < json.totalPages);
  return { items, more: Boolean(more) && items.length > 0 };
}

const raws = [];
for (let page = 1; page < 1000; page++) {
  const { items, more } = await fetchPage(page);
  raws.push(...items);
  process.stdout.write(`\rSeite ${page}: ${raws.length} Datensätze`);
  if (!more) break;
}
console.log();

// Varianten (Farbe/Größe je Zeile) zu einem Produkt zusammenfassen
const groups = new Map();
for (const raw of raws) {
  const m = mapItem(raw);
  const g = groups.get(m.parent) ?? { ...m, colorsMap: new Map(), sizesSet: new Set(), prices: [], imgs: new Set(), stockSum: 0 };
  if (m.price != null && !Number.isNaN(m.price)) g.prices.push(m.price);
  if (m.image) g.imgs.add(typeof m.image === 'string' ? m.image : m.image.url);
  if (Array.isArray(m.images)) m.images.forEach((i) => g.imgs.add(typeof i === 'string' ? i : i.url));
  if (m.color) g.colorsMap.set(m.color, { name: m.color, hex: m.colorHex, image: m.colorImage });
  if (Array.isArray(m.colors)) m.colors.forEach((c) => typeof c === 'string' ? g.colorsMap.set(c, { name: c }) : g.colorsMap.set(c.name, { name: c.name, hex: c.hex, image: c.image }));
  if (m.size) g.sizesSet.add(String(m.size));
  if (Array.isArray(m.sizes)) m.sizes.forEach((s) => g.sizesSet.add(String(typeof s === 'string' ? s : s.name)));
  if (m.stock) g.stockSum += m.stock;
  groups.set(m.parent, g);
}

const products = [...groups.values()]
  .filter((g) => g.prices.length)
  .map((g) => ({
    id: slug(g.parent),
    sku: g.parent,
    name: String(g.name).trim(),
    brand: String(g.brand).trim(),
    category: String(g.category).trim(),
    categorySlug: slug(g.category),
    description: String(g.description).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    material: g.material,
    gender: g.gender,
    basePrice: Math.min(...g.prices), // "ab"-Preis
    images: [...g.imgs].filter(Boolean),
    colors: [...g.colorsMap.values()],
    sizes: [...g.sizesSet],
    stock: g.stockSum || undefined,
    tags: [],
  }));

if (products.length === 0) {
  console.error('0 Produkte gemappt – Feldnamen in mapItem() prüfen. Beispiel-Datensatz:');
  console.error(JSON.stringify(raws[0], null, 2)?.slice(0, 2000));
  process.exit(1);
}

const out = path.join(process.cwd(), 'data', 'products.json');
fs.writeFileSync(out + '.tmp', JSON.stringify(products));
fs.renameSync(out + '.tmp', out); // atomar – Shop lädt automatisch neu
console.log(`${products.length} Produkte gespeichert (${raws.length} Varianten).`);
