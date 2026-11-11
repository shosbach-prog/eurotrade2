// L-Shop -> data/products.json
// Aufruf: npm run sync   (per Cron z. B. nachts: 0 3 * * * cd /app && npm run sync)
//
// Sobald der API-Key + die Doku von L-Shop da sind, muss i. d. R. nur mapItem() unten
// angepasst werden. Alles andere (Suche, Preise, Shop) bleibt unverändert.

import { loadEnv, toProducts, writeProducts } from './feed-lib.mjs';
loadEnv();

const { LSHOP_API_URL, LSHOP_API_KEY, LSHOP_AUTH_MODE = 'header' } = process.env;
if (!LSHOP_API_URL || !LSHOP_API_KEY) {
  console.error('LSHOP_API_URL und LSHOP_API_KEY in .env setzen. Bis dahin laufen Demo-Daten.');
  process.exit(1);
}

// Feldzuordnung: scripts/feed-lib.mjs → mapItem()

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

const products = toProducts(raws);

if (products.length === 0) {
  console.error('0 Produkte gemappt – Feldnamen in mapItem() prüfen. Beispiel-Datensatz:');
  console.error(JSON.stringify(raws[0], null, 2)?.slice(0, 2000));
  process.exit(1);
}

writeProducts(products); // atomar – Shop lädt automatisch neu
console.log(`${products.length} Produkte gespeichert (${raws.length} Varianten).`);
