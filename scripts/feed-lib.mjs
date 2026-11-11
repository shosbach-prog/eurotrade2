// Gemeinsame Logik für L-Shop-API (sync-lshop.mjs) und Datei-Feeds (import-feed.mjs)
// Eine Zeile/ein Datensatz = eine Variante (Farbe + Größe). Wird zu Produkten zusammengefasst.
import fs from 'node:fs';
import path from 'node:path';

export function loadEnv() {
  const envFile = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export const slug = (s) => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const num = (v) => {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number') return v;
  let s = String(v).replace(/[^\d,.-]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Feldnamen vereinheitlichen: "Artikel-Nr." -> "artikelnr" */
const nk = (k) => String(k).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9.]/g, '');
function get(o, keys) {
  for (const k of keys) {
    const v = k.includes('.') ? k.split('.').reduce((x, p) => (x == null ? x : x[p]), o) : o[k] ?? o.__norm?.[nk(k)];
    if (v != null && v !== '') return v;
  }
}

// ---------- Feldzuordnung: bei abweichenden Namen hier ergänzen ----------
export function mapItem(raw) {
  raw.__norm ??= Object.fromEntries(Object.entries(raw).map(([k, v]) => [nk(k), v]));
  const parent = get(raw, ['articleNumber', 'artikelnummer', 'artikelnr', 'article_no', 'parentSku', 'model', 'modell', 'styleCode', 'stylenr', 'herstellernummer', 'sku', 'id']);
  const list = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v.includes('|') ? v.split('|') : typeof v === 'string' && /^https?:/.test(v) && v.includes(',') ? v.split(',') : v ? [v] : []);
  // Staffelpreise: Felder wie "preis_10", "price_ab_50", "staffelpreis100"
  const tiers = [];
  for (const [k, v] of Object.entries(raw.__norm)) {
    const m = k.match(/^(?:ek|preis|price|staffelpreis|staffel|netprice)(?:ab)?(\d{1,5})$/);
    const n = num(v);
    if (m && n) tiers.push({ min: Number(m[1]), price: n });
  }
  return {
    parent: String(parent ?? '').trim(),
    name: get(raw, ['name', 'title', 'bezeichnung', 'artikelbezeichnung', 'productName', 'kurzbeschreibung']),
    brand: get(raw, ['brand', 'marke', 'manufacturer', 'hersteller', 'brand.name']) ?? '',
    category: get(raw, ['category', 'kategorie', 'productGroup', 'warengruppe', 'produkt', 'produktart', 'category.name']) ?? 'Sonstiges',
    description: get(raw, ['description', 'beschreibung', 'longDescription', 'langtext', 'text']) ?? '',
    material: get(raw, ['material', 'materialzusammensetzung', 'composition', 'zusammensetzung']),
    gender: get(raw, ['gender', 'geschlecht', 'zielgruppe', 'target']),
    price: num(get(raw, ['ek', 'ekpreis', 'einkaufspreis', 'purchasePrice', 'netPrice', 'nettopreis', 'price', 'preis', 'preis1', 'prices.0.price'])),
    tiers,
    images: list(get(raw, ['images', 'bilder', 'image', 'imageUrl', 'bild', 'bildurl', 'picture'])).map((i) => (typeof i === 'string' ? i.trim() : i?.url)).filter(Boolean),
    color: get(raw, ['color', 'farbe', 'farbname', 'colorName', 'color.name']),
    colorHex: get(raw, ['colorHex', 'hex', 'farbcode', 'color.hex']),
    colorImages: list(get(raw, ['colorImage', 'colorImages', 'variantImage', 'variantenbild', 'farbbild'])).map((i) => (typeof i === 'string' ? i.trim() : i?.url)).filter(Boolean),
    size: get(raw, ['size', 'groesse', 'größe', 'sizeName']),
    stock: num(get(raw, ['stock', 'bestand', 'lagerbestand', 'verfuegbar', 'availability', 'qty', 'menge'])),
    sizeChart: get(raw, ['sizeChart', 'groessentabelle', 'masstabelle']),
  };
}
// -------------------------------------------------------------------------

const CAT = { 'Poloshirts': 'Poloshirts', 'T-Shirts': 'T-Shirts', 'Hemden': 'Hemden & Blusen', 'Blusen': 'Hemden & Blusen', 'Sweatshirts & -jacken': 'Sweatshirts', 'Pullover': 'Sweatshirts', 'Jacken': 'Jacken', 'Westen & Bodywarmer': 'Jacken', 'Caps': 'Caps & Mützen', 'Mützen': 'Caps & Mützen', 'Taschen': 'Taschen', 'Handtücher': 'Handtücher', 'Schürzen': 'Arbeitskleidung', 'Kittel & Kasacks': 'Arbeitskleidung', 'Hosen': 'Hosen' };
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL', '6XL'];
const sizeRank = (s) => { const i = SIZE_ORDER.indexOf(String(s).toUpperCase()); return i >= 0 ? i : 100 + (parseFloat(s) || 0); };

/** Varianten -> Produkte (Bestand je Farbe/Größe, Farbbilder, Staffel-EK) */
export function toProducts(raws) {
  const groups = new Map();
  for (const raw of raws) {
    const m = mapItem(raw);
    if (!m.parent) continue;
    const g = groups.get(m.parent) ?? { ...m, colorsMap: new Map(), sizesSet: new Set(), prices: [], tierMap: new Map(), imgs: new Set(), stockBy: {}, stockSum: 0 };
    if (m.name && !g.name) g.name = m.name;
    if (m.price != null) g.prices.push(m.price);
    for (const t of m.tiers) if (t.min > 1) g.tierMap.set(t.min, Math.min(g.tierMap.get(t.min) ?? Infinity, t.price));
    m.images.forEach((i) => g.imgs.add(i));
    if (m.color) {
      const c = g.colorsMap.get(m.color) ?? { name: String(m.color).trim(), hex: m.colorHex ? `#${String(m.colorHex).replace('#', '').toLowerCase()}` : undefined, images: [] };
      for (const i of [...m.colorImages, ...m.images]) if (!c.images.includes(i)) c.images.push(i);
      g.colorsMap.set(m.color, c);
    }
    if (m.size) g.sizesSet.add(String(m.size).trim());
    if (m.stock != null) { g.stockBy[`${m.color ?? ''}|${m.size ?? ''}`] = m.stock; g.stockSum += m.stock; }
    if (m.sizeChart) g.sizeChart = m.sizeChart;
    groups.set(m.parent, g);
  }
  return [...groups.values()].filter((g) => g.prices.length).map((g) => {
    const category = CAT[String(g.category).trim()] ?? String(g.category).trim();
    const name = String(g.name ?? g.parent).trim();
    const colors = [...g.colorsMap.values()].map((c) => ({ ...c, images: c.images.length ? c.images.slice(0, 8) : undefined, hex: c.hex || undefined }));
    return {
      id: slug(g.parent), sku: g.parent, name, brand: String(g.brand).trim(), category, categorySlug: slug(category),
      description: String(g.description).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      material: g.material, gender: g.gender ?? (/women|ladies|damen/i.test(name) ? 'Damen' : /kids|kinder|junior|baby/i.test(name) ? 'Kinder' : /men´s|men's|herren/i.test(name) ? 'Herren' : 'Unisex'),
      basePrice: Math.max(...g.prices), // vorsichtig: teuerste Variante (z. B. Farbe statt Weiß) – Angebot wird ohnehin geprüft
      baseTiers: [...g.tierMap.entries()].map(([min, price]) => ({ min, price })).sort((a, b) => a.min - b.min),
      images: [...g.imgs].slice(0, 12),
      ...(g.sizeChart ? { sizeChart: g.sizeChart } : {}),
      colors, sizes: [...g.sizesSet].sort((a, b) => sizeRank(a) - sizeRank(b)),
      stock: g.stockSum || undefined, stockBy: Object.keys(g.stockBy).length ? g.stockBy : undefined,
      tags: [category],
    };
  });
}

/** Ergebnis schreiben: data/products.json (live, Shop lädt automatisch neu) */
export function writeProducts(products, target = path.join(process.cwd(), 'data', 'products.json')) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target + '.tmp', JSON.stringify(products));
  fs.renameSync(target + '.tmp', target);
}
