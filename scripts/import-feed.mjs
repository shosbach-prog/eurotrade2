// Händler-Feed von L-Shop (CSV, XML oder JSON) -> data/products.json
// Aufruf:  npm run import-feed -- pfad/zur/datei.csv   [--seed]   (--seed schreibt nach seed/products.json)
// Spalten werden automatisch erkannt (Artikelnummer, Farbe, Größe, EK, Bestand, Bilder, preis_10/preis_50 …).
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv, toProducts, writeProducts } from './feed-lib.mjs';

loadEnv();
const file = process.argv.find((a, i) => i > 1 && !a.startsWith('--'));
if (!file || !fs.existsSync(file)) { console.error('Datei angeben: npm run import-feed -- feed.csv'); process.exit(1); }
const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');

function parseCSV(t) {
  const first = t.split(/\r?\n/, 1)[0];
  const d = [';', '\t', ',', '|'].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
    if (c === '"') q = true; else if (c === d) { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}
function parseXML(t) {
  // einfache Variante: wiederkehrende Elemente mit Kind-Tags als Datensätze
  const tag = ['item', 'product', 'article', 'artikel', 'variant', 'row', 'offer'].find((n) => new RegExp(`<${n}[\\s>]`, 'i').test(t));
  if (!tag) throw new Error('XML: keine <item>/<product>/<article>-Elemente gefunden');
  const dec = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
  return [...t.matchAll(new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, 'gi'))].map((m) => {
    const o = {};
    for (const f of m[0].replace(/^<[^>]+>/, '').replace(/<\/[^>]+>\s*$/, '').matchAll(/<([\w:-]+)[^>]*>([\s\S]*?)<\/\1>/g)) if (f[1].toLowerCase() !== tag) o[f[1]] = o[f[1]] ? `${o[f[1]]}|${dec(f[2])}` : dec(f[2]);
    return o;
  });
}

const ext = path.extname(file).toLowerCase();
const raws = ext === '.json' ? [].concat(JSON.parse(text).products ?? JSON.parse(text).items ?? JSON.parse(text)) : ext === '.xml' || text.trimStart().startsWith('<') ? parseXML(text) : parseCSV(text);
console.log(`${raws.length} Datensätze gelesen. Erkannte Spalten: ${Object.keys(raws[0] ?? {}).slice(0, 25).join(', ')}`);
const products = toProducts(raws);
if (!products.length) { console.error('0 Produkte – Spaltennamen in scripts/feed-lib.mjs (mapItem) ergänzen. Beispiel:', JSON.stringify(raws[0], null, 1).slice(0, 1500)); process.exit(1); }
const target = process.argv.includes('--seed') ? path.join(process.cwd(), 'seed', 'products.json') : undefined;
writeProducts(products, target);
const withStock = products.filter((p) => p.stockBy).length, withTiers = products.filter((p) => p.baseTiers.length).length;
console.log(`✓ ${products.length} Produkte gespeichert${target ? ' (seed)' : ''} · ${withStock} mit Bestand · ${withTiers} mit Staffel-EK · ${products.filter((p) => p.colors.some((c) => c.images)).length} mit Farbbildern`);
