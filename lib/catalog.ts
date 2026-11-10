import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type MiniSearch from 'minisearch';
import type { Category, Product, PublicProduct } from './types';
import { buildIndex, buildSkuMap, runSearch, type SearchDoc } from './search';
import { gross, sellPrice } from './pricing';

const LIVE = path.join(process.cwd(), 'data', 'products.json');
const SEED = path.join(process.cwd(), 'seed', 'products.demo.json');
const file = () => (fs.existsSync(LIVE) ? LIVE : SEED);

type State = { mtime: number; products: Product[]; byId: Map<string, Product>; index: MiniSearch<SearchDoc>; skus: Map<string, string>; categories: Category[] };
let state: State | null = null;

/** Lädt data/products.json neu, sobald der Sync die Datei aktualisiert hat – kein Neustart nötig */
function load(): State {
  const FILE = file();
  const mtime = fs.statSync(FILE).mtimeMs;
  if (state && state.mtime === mtime) return state;
  const products: Product[] = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const catMap = new Map<string, Category>();
  for (const p of products) {
    const c = catMap.get(p.categorySlug) ?? { name: p.category, slug: p.categorySlug, count: 0 };
    c.count++;
    catMap.set(p.categorySlug, c);
  }
  state = {
    mtime,
    products,
    byId: new Map(products.map((p) => [p.id, p])),
    index: buildIndex(products),
    skus: buildSkuMap(products),
    categories: [...catMap.values()].sort((a, b) => b.count - a.count),
  };
  return state;
}

export function toPublic(p: Product): PublicProduct {
  const { basePrice, ...rest } = p;
  const price = sellPrice(basePrice, p.categorySlug);
  return { ...rest, price, priceGross: gross(price) };
}

export const getCategories = () => load().categories;
export const getProduct = (id: string) => {
  const p = load().byId.get(id);
  return p ? toPublic(p) : null;
};
export const getByCategory = (slug: string) =>
  load().products.filter((p) => p.categorySlug === slug).map(toPublic);
export const getFeatured = (n = 12) => load().products.slice(0, n).map(toPublic);
export const productCount = () => load().products.length;

export function search(q: string, limit = 48): PublicProduct[] {
  const s = load();
  return runSearch(s.index, q, limit, s.skus).map((id) => toPublic(s.byId.get(id)!));
}
