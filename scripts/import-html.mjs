// Gespeicherte L-SHOP-TEAM-Produktseiten (.html) -> seed/products.json
// Aufruf:  npm run import-html -- <ordner-mit-html-dateien>
// Preise (EK netto) optional in seed/preise.csv:  Artikelnummer;EK   z. B.  AQ010;6,85
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] || 'import';
const OUT = path.join(process.cwd(), 'seed', 'products.json');
const PRICES = path.join(process.cwd(), 'seed', 'preise.csv');

const slug = (s) => String(s).toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const decode = (s) => s.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/&acute;/g,'´').replace(/&deg;/g,'°').replace(/&reg;/g,'®').replace(/&sup2;/g,'²').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(n)).replace(/&([a-z])uml;/gi,(_,c)=>({a:'ä',o:'ö',u:'ü',A:'Ä',O:'Ö',U:'Ü'})[c]).replace(/&szlig;/g,'ß');

const LABELS = new Set(['Materialzusammensetzung','Material','Grammatur in g/m²','Größenlauf','Farbigkeit','Verarbeitung','Veredelungsangabe Hersteller','Label','Produkt','Details','Ärmel','Kragen / Kapuze','Ausschnitt','Nackenband','Passform','Einsatzgebiet','Polybeutel','Zertifizierung','Pflegehinweis','Ursprungsland Bezeichnung','Hersteller-Katalognummer','Warennummer','Herstellerangaben gemäß GPSR:','Digitaler Produktpass','Knöpfe','Verschluss','Taschen','Kapuze','Saum','Bündchen','Futter','Wassersäule','Atmungsaktivität','Fassungsvermögen','Maße','Größe','Gewicht','Henkel','Schirm']);
const isLabel = (l) => LABELS.has(l) || /\(Art\)$/.test(l);

const CAT = { 'Poloshirts': 'Poloshirts', 'T-Shirts': 'T-Shirts', 'Hemden': 'Hemden & Blusen', 'Blusen': 'Hemden & Blusen', 'Sweatshirts & -jacken': 'Sweatshirts', 'Pullover': 'Sweatshirts', 'Jacken': 'Jacken', 'Westen & Bodywarmer': 'Jacken', 'Caps': 'Caps & Mützen', 'Mützen': 'Caps & Mützen', 'Taschen': 'Taschen', 'Handtücher': 'Handtücher', 'Schürzen': 'Arbeitskleidung', 'Kittel & Kasacks': 'Arbeitskleidung', 'Hosen': 'Hosen' };

function parse(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const lines = decode(raw.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, '\n'))
    .split('\n').map((l) => l.trim()).filter(Boolean);

  const iBild = lines.indexOf('Artikelbilder');
  let i = iBild + 1;
  while (/^\d+$/.test(lines[i])) i++;
  const name = lines[i];
  const brand = lines[i + 2] === undefined ? '' : lines[i + 1] === 'Zurück zur Übersicht' ? lines[i + 2] : lines[i + 1];
  const sku = (lines.find((l) => l.startsWith('Artikelnummer:')) || '').replace('Artikelnummer:', '').trim();
  if (!sku || !name) return null;

  // Beschreibung (Stichpunkte) + Spezifikationen
  const iDl = lines.indexOf('Downloads/Datenblätter');
  const iEnd = lines.findIndex((l, k) => k > iDl && (l === 'PDF' || l.startsWith('Artikelbilder finden')));
  const block = lines.slice(iDl + 1, iEnd > 0 ? iEnd : undefined);
  const features = [];
  const specs = {};
  let key = null;
  for (const l of block) {
    if (isLabel(l)) { key = l.replace(/:$/, ''); specs[key] = []; continue; }
    if (!key) features.push(l); else specs[key].push(l);
  }
  const sp = (k) => (specs[k] || []).join(', ');

  // Farben mit HEX – aus der Farbauswahl der Seite (zuverlässiger als der Text)
  const colors = [];
  for (const chunk of raw.split('data-toggle="variant-color" data-value="').slice(1)) {
    const name = decode(chunk.slice(0, chunk.indexOf('"'))).trim();
    if (!name || name.includes('<%')) continue;
    const field = chunk.slice(0, chunk.indexOf('</a>'));
    const hx = field.match(/background:\s*(#[0-9a-fA-F]{6})/);
    const sw = field.match(/background-image:\s*url\((data:image\/[^)]+)\)/);
    if (colors.some((c) => c.name === name)) continue;
    const c = { name };
    if (hx) c.hex = hx[1].toLowerCase();
    if (sw) c.swatch = sw[1]; // Meliert/gemustert: Stoffmuster als Bild
    colors.push(c);
  }
  if (!colors.length) lines.forEach((l, k) => {
    const m = l.match(/^HEX\s*(#[0-9a-f]{6})/i);
    if (m && !/^(Pantone|CMYK|RGB)/.test(lines[k - 1]) && !colors.some((c) => c.name === lines[k - 1])) colors.push({ name: lines[k - 1], hex: m[1].toLowerCase() });
  });
  // Größen je Farbgruppe (Fallback, wenn kein Größenlauf angegeben)
  const sizeHeads = [...raw.matchAll(/class="variant-size-heading">\s*([^<]+)</g)].map((m) => decode(m[1]).replace(/^\s*Größen?:\s*/, '').trim());

  // Bilder (große Variante, in Reihenfolge)
  const imgs = new Map();
  for (const m of raw.matchAll(/https:\/\/shop\.l-shop-team\.de\/out\/pictures\/generated\/product\/(\d+)\/665_665_75\/([\w-]+\.jpg)/g))
    if (!imgs.has(m[1])) imgs.set(m[1], m[0]);
  let images = [...imgs.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);
  if (!images.length) // Artikel mit nur einem Bild: Originalbild verwenden
    images = [...new Set([...raw.matchAll(/class="cloud-zoom-gallery" href="(https:\/\/shop\.l-shop-team\.de\/out\/pictures\/master\/product\/[^"]+\.jpg)"/g)].map((m) => m[1]))];

  const sizeChart = (raw.match(/href="(https:\/\/shop\.l-shop-team\.de\/out\/media\/[^"]+\.pdf)"[^>]*>\s*Größentabelle/) || [])[1];
  const typ = (specs['Produkt'] || [])[0] || 'Sonstiges';
  const category = CAT[typ] || typ;
  const gender = /women|ladies|damen/i.test(name) ? 'Damen' : /kids|kinder|baby|junior/i.test(name) ? 'Kinder' : /men´s|men's|mens|herren/i.test(name) ? 'Herren' : 'Unisex';
  const gsm = sp('Grammatur in g/m²');

  return {
    id: slug(sku), sku, name, brand, category, categorySlug: slug(category),
    description: features.join(' · '),
    features,
    material: [sp('Material'), gsm].filter(Boolean).join(', '),
    composition: sp('Materialzusammensetzung'),
    gender,
    basePrice: null,
    images,
    ...(sizeChart ? { sizeChart } : {}),
    colors,
    sizes: (() => {
      const s = sp('Größenlauf').split(/,\s*/).filter(Boolean);
      if (s.length) return s;
      const all = [];
      for (const h of sizeHeads) for (const z of h.split(/,\s*/)) if (z && !all.includes(z)) all.push(z);
      return all;
    })(),
    specs: {
      Passform: sp('Passform'), Ärmel: sp('Ärmel'), Veredelung: sp('Veredelungsangabe Hersteller'),
      Zertifizierung: (specs['Zertifizierung'] || [])[0] || '', Pflege: sp('Pflegehinweis'), Herkunft: sp('Ursprungsland Bezeichnung'),
    },
    tags: [typ, ...(specs['Details'] || []), ...(specs['Einsatzgebiet'] || []), gender],
  };
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => path.join(dir, f));
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
const bySku = new Map(existing.map((p) => [p.sku, p]));
let n = 0;
for (const f of files) {
  const p = parse(f);
  if (!p) { console.warn('übersprungen:', path.basename(f)); continue; }
  bySku.set(p.sku, { ...p, basePrice: bySku.get(p.sku)?.basePrice ?? null });
  n++;
  console.log(`✓ ${p.sku}  ${p.name}  (${p.brand}, ${p.colors.length} Farben, ${p.sizes.length} Größen, ${p.images.length} Bilder)`);
}
// Preise aus CSV
if (fs.existsSync(PRICES)) {
  for (const row of fs.readFileSync(PRICES, 'utf8').split(/\r?\n/)) {
    if (!row.trim() || row.startsWith('#')) continue;
    const parts = /[;\t]/.test(row) ? row.split(/[;\t]/) : row.split(',');
    const [sku, ek] = parts.map((x) => x && x.trim());
    const v = Number(String(ek ?? '').replace(',', '.'));
    if (sku && bySku.has(sku) && v > 0) bySku.get(sku).basePrice = v;
  }
}
fs.writeFileSync(OUT, JSON.stringify([...bySku.values()], null, 1));
console.log(`${n} importiert, ${bySku.size} Artikel gesamt in seed/products.json`);
