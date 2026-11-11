import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type MiniSearch from 'minisearch';
import type { Category, Product, PublicProduct } from './types';
import { buildIndex, buildSkuMap, runSearch, type SearchDoc } from './search';
import { gross, priceTiers, sellPrice } from './pricing';
import { sortColors } from './colors';
import { ratingFor } from './reviews';
import { overridesMtime, readOverrides } from './artikel';
import { slugify } from './format';

const LIVE = path.join(process.cwd(), 'data', 'products.json');
const SEED = path.join(process.cwd(), 'seed', 'products.json');
const file = () => (fs.existsSync(LIVE) ? LIVE : SEED);

type State = { mtime: string; all: Product[]; base: Map<string, Product>; products: Product[]; byId: Map<string, Product>; index: MiniSearch<SearchDoc>; skus: Map<string, string>; categories: Category[] };
let state: State | null = null;

/** Lädt data/products.json neu, sobald der Sync die Datei aktualisiert hat – kein Neustart nötig */
function load(): State {
  const FILE = file();
  const mtime = `${fs.statSync(FILE).mtimeMs}|${overridesMtime()}`;
  if (state && state.mtime === mtime) return state;
  const raw: Product[] = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const base = new Map(raw.map((p) => [p.id, p]));
  const ov = readOverrides();
  const merged: Product[] = raw.map((p) => (ov[p.id] ? { ...p, ...ov[p.id], id: p.id, custom: false } : p));
  for (const [id, o] of Object.entries(ov)) if (o.custom && !base.has(id)) merged.push({ sku: id, name: 'Neuer Artikel', brand: '', category: 'Sonstiges', description: '', basePrice: null, images: [], colors: [], sizes: [], ...o, id } as Product);
  for (const p of merged) { p.categorySlug = p.categorySlug && !ov[p.id]?.category ? p.categorySlug : slugify(p.category || 'sonstiges'); }
  const all = merged.map((p, k) => [p, k] as const).sort((a, b) => Number(!!b[0].top) - Number(!!a[0].top) || a[1] - b[1]).map(([p]) => p);
  const products = all.filter((p) => !p.hidden);
  const catMap = new Map<string, Category>();
  for (const p of products) {
    const c = catMap.get(p.categorySlug) ?? { name: p.category, slug: p.categorySlug, count: 0 };
    c.count++;
    catMap.set(p.categorySlug, c);
  }
  state = {
    mtime,
    all,
    base,
    products,
    byId: new Map(products.map((p) => [p.id, p])),
    index: buildIndex(products),
    skus: buildSkuMap(products),
    categories: [...catMap.values()].sort((a, b) => b.count - a.count),
  };
  return state;
}

/** Kundenkontext: eigener Aufschlag, eigene Kollektion */
export type Ctx = { markup?: number | null; skus?: string[]; exclusive?: boolean; tiers?: string | null; /** Schaufenster: keine Preise */ locked?: boolean } | null | undefined;

export function toPublic(p: Product, ctx?: Ctx): PublicProduct {
  const { basePrice, baseTiers, hidden: _h, custom: _c, ...rest } = p;
  const price = !ctx?.locked && basePrice != null && basePrice > 0 ? sellPrice(basePrice, p.categorySlug, ctx?.markup) : null;
  // Echte Staffel-EK von L-Shop haben Vorrang – sonst Rabattstaffel auf den Verkaufspreis
  const tiers = price == null ? []
    : baseTiers?.length && !ctx?.tiers
      ? baseTiers.filter((t) => t.min > 1 && t.price > 0).sort((a, b) => a.min - b.min).map((t) => ({ min: t.min, price: sellPrice(t.price, p.categorySlug, ctx?.markup) })).filter((t) => t.price < price)
      : priceTiers(price, ctx?.tiers);
  return { ...rest, colors: sortColors(p.colors), price, priceGross: price != null ? gross(price) : null, tiers, rating: ratingFor(p.id), ...(ctx?.locked ? { locked: true } : {}) };
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
/** Kategorien mit Vorschaubild (erstes Artikelbild) */
export function categoryTiles(ctx?: Ctx, slugs?: string[]) {
  const ps = products(ctx);
  return getCategories(ctx).filter((c) => !slugs || slugs.includes(c.slug)).map((c) => ({ ...c, image: ps.find((p) => p.categorySlug === c.slug && p.images[0])?.images[0] }));
}
/** Admin: alle Artikel inkl. ausgeblendeter, mit EK */
export const adminProducts = () => load().all;
export const adminProduct = (id: string) => { const s = load(); return { p: s.all.find((x) => x.id === id) ?? null, original: s.base.get(id) ?? null }; };
export const imageInUse = (src: string) => load().all.some((p) => p.images.includes(src) || p.colors.some((c) => c.image === src || c.images?.includes(src)));
/** Alle Artikel (Admin: Auswahl für Kollektionen) */
export const allProductsBrief = () => load().products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, brand: p.brand }));

export function search(q: string, limit = 48, ctx?: Ctx): PublicProduct[] {
  const s = load();
  const ok = visible(ctx);
  return runSearch(s.index, q, limit * 2, s.skus).map((id) => s.byId.get(id)!).filter(ok).slice(0, limit).map((p) => toPublic(p, ctx));
}

/* ---------- „Meinten Sie …?“ bei 0 Treffern ---------- */
let vocab: { mtime: string; words: string[] } | null = null;
const norm = (w: string) => w.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
export function didYouMean(q: string, ctx?: Ctx): string | null {
  const s = load();
  if (!vocab || vocab.mtime !== s.mtime) {
    const set = new Set<string>();
    for (const p of s.products) for (const w of `${p.name} ${p.brand} ${p.category} ${(p.tags ?? []).join(' ')} ${p.colors.map((c) => c.name).join(' ')}`.split(/[\s/,·()-]+/)) if (w.length > 2) set.add(w);
    vocab = { mtime: s.mtime, words: [...set] };
  }
  const words = q.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const fixed = words.map((w) => {
    const n = norm(w);
    if (n.length < 3) return w;
    let best = w, bd = Math.max(1, Math.floor(n.length / 4)) + 1;
    for (const v of vocab!.words) { const d = lev(n, norm(v)); if (d < bd) { bd = d; best = v; } }
    return best;
  });
  const sug = fixed.join(' ');
  return sug.toLowerCase() !== q.trim().toLowerCase() && search(sug, 1, ctx).length ? sug : null;
}

/** Alle sichtbaren Artikel einer Marke (inkl. Untermarken-Schreibweisen) */
export const getByBrand = (pred: (brand: string) => boolean, ctx?: Ctx) => products(ctx).filter((p) => pred(p.brand)).map((p) => toPublic(p, ctx));
/** Anzahl Artikel je Herstellername */
export function brandCounts(ctx?: Ctx) { const m = new Map<string, number>(); for (const p of products(ctx)) m.set(p.brand, (m.get(p.brand) ?? 0) + 1); return m; }
