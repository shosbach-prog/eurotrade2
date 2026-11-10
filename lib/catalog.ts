import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type MiniSearch from 'minisearch';
import type { Category, Product, PublicProduct } from './types';
import { buildIndex, buildSkuMap, runSearch, type SearchDoc } from './search';
import { gross, sellPrice } from './pricing';
import { sortColors } from './colors';

const LIVE = path.join(process.cwd(), 'data', 'products.json');
const SEED = path.join(process.cwd(), 'seed', 'products.json');
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

/** Kundenkontext: eigener Aufschlag, eigene Kollektion */
export type Ctx = { markup?: number | null; skus?: string[]; exclusive?: boolean } | null | undefined;

export function toPublic(p: Product, ctx?: Ctx): PublicProduct {
  const { basePrice, ...rest } = p;
  const price = basePrice != null && basePrice > 0 ? sellPrice(basePrice, p.categorySlug, ctx?.markup) : null;
  return { ...rest, colors: sortColors(p.colors), price, priceGross: price != null ? gross(price) : null };
}

const skuSet = (ctx: Ctx) => new Set((ctx?.skus ?? []).map((x) => x.toUpperCase()));
/** Sichtbar für diesen Kunden? (exklusive Kunden sehen nur ihre Kollektion) */
const visible = (ctx: Ctx) => {
  const set = skuSet(ctx);
  return ctx?.exclusive && set.size ? (p: Product) => set.has(p.sku.toUpperCase()) : () => true;
};
const products = (ctx: Ctx) => load().products.filter(visible(ctx));

export function getCategories(ctx?: Ctx): Category[] {
  if (!(ctx?.exclusive && ctx.skus?.length)) return load().categories;
  const m = new Map<string, Category>();
  for (const p of products(ctx)) {
    const c = m.get(p.categorySlug) ?? { name: p.category, slug: p.categorySlug, count: 0 };
    c.count++; m.set(p.categorySlug, c);
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}
export const getProduct = (id: string, ctx?: Ctx) => {
  const p = load().byId.get(id);
  return p && visible(ctx)(p) ? toPublic(p, ctx) : null;
};
export const getByCategory = (slug: string, ctx?: Ctx) => products(ctx).filter((p) => p.categorySlug === slug).map((p) => toPublic(p, ctx));
export const getFeatured = (n = 12, ctx?: Ctx) => products(ctx).slice(0, n).map((p) => toPublic(p, ctx));
export const productCount = (ctx?: Ctx) => products(ctx).length;
/** Kundenkollektion in der hinterlegten Reihenfolge */
export function getCollection(ctx?: Ctx): PublicProduct[] {
  const s = load();
  const bySku = new Map(s.products.map((p) => [p.sku.toUpperCase(), p]));
  return (ctx?.skus ?? []).flatMap((k) => { const p = bySku.get(k.toUpperCase()); return p ? [toPublic(p, ctx)] : []; });
}
/** Alle Artikel (Admin: Auswahl für Kollektionen) */
export const allProductsBrief = () => load().products.map((p) => ({ sku: p.sku, name: p.name, brand: p.brand }));

export function search(q: string, limit = 48, ctx?: Ctx): PublicProduct[] {
  const s = load();
  const ok = visible(ctx);
  return runSearch(s.index, q, limit * 2, s.skus).map((id) => s.byId.get(id)!).filter(ok).slice(0, limit).map((p) => toPublic(p, ctx));
}
