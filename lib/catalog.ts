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
import { productSlug, slugify } from './format';
import { pictosFor } from './picto';
import { applyEol, auslaufMtime } from './auslauf';
import { kindOf } from './copy';

const LIVE = path.join(process.cwd(), 'data', 'products.json');
const SEED = path.join(process.cwd(), 'seed', 'products.json');
const file = () => (fs.existsSync(LIVE) ? LIVE : SEED);

type State = { mtime: string; all: Product[]; base: Map<string, Product>; products: Product[]; byId: Map<string, Product>; bySlug: Map<string, Product>; index: MiniSearch<SearchDoc>; skus: Map<string, string>; categories: Category[] };
let state: State | null = null;

/** Lädt data/products.json neu, sobald der Sync die Datei aktualisiert hat – kein Neustart nötig */
function load(): State {
  const FILE = file();
  const mtime = `${fs.statSync(FILE).mtimeMs}|${overridesMtime()}|${auslaufMtime()}|${new Date().toISOString().slice(0, 10)}`;
  if (state && state.mtime === mtime) return state;
  const raw: Product[] = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const base = new Map(raw.map((p) => [p.id, p]));
  const ov = readOverrides();
  const merged: Product[] = raw.map((p) => applyEol(ov[p.id] ? { ...p, ...ov[p.id], id: p.id, custom: false } : p));
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
    bySlug: new Map(products.map((p) => [productSlug(p), p])),
    index: buildIndex(products),
    skus: buildSkuMap(products),
    categories: [...catMap.values()].sort((a, b) => b.count - a.count),
  };
  return state;
}

/** Kundenkontext: eigener Aufschlag, eigene Kollektion */
export type Ctx = { markup?: number | null; skus?: string[]; exclusive?: boolean; tiers?: string | null; /** Schaufenster: keine Preise */ locked?: boolean } | null | undefined;

/* WebP-Varianten der lokalen Produktbilder (public/p/…/x.webp neben x.jpg) */
const webpCache = new WeakMap<Product, boolean>();
const webpExists = new Map<string, boolean>();
const webpOk = (src?: string) => {
  if (!src) return true;
  if (!src.startsWith('/p/')) return true; // externe Bilder bleiben unverändert
  if (!/\.jpe?g$/i.test(src)) return false;
  let v = webpExists.get(src);
  if (v === undefined) { v = fs.existsSync(path.join(process.cwd(), 'public', src.replace(/\.jpe?g$/i, '.webp'))); webpExists.set(src, v); }
  return v;
};
const midCache = new WeakMap<Product, boolean>();
const midExists = new Map<string, boolean>();
function hasMid(p: Product) {
  let v = midCache.get(p);
  if (v === undefined) {
    const all = [...p.images, ...p.colors.flatMap((c) => [c.image, ...(c.images ?? [])])].filter((x): x is string => !!x);
    v = all.length > 0 && all.every((src) => {
      if (!src.startsWith('/p/') || !/\.jpe?g$/i.test(src)) return false;
      let e = midExists.get(src);
      if (e === undefined) { e = fs.existsSync(path.join(process.cwd(), 'public', src.replace(/\.jpe?g$/i, '.m.webp'))); midExists.set(src, e); }
      return e;
    });
    midCache.set(p, v);
  }
  return v;
}
function hasWebp(p: Product) {
  let v = webpCache.get(p);
  if (v === undefined) { v = p.images.length > 0 && [...p.images, ...p.colors.flatMap((c) => [c.image, ...(c.images ?? [])])].every(webpOk); webpCache.set(p, v); }
  return v;
}
/** Schlanke Fassung für Produktlisten (ohne lange Texte) – spart Datenmenge im Browser */
export function slimCard(p: PublicProduct): PublicProduct {
  const { description: _d, features, specs, composition: _c, stockBy: _s, sizeChart: _sc, tags: _t, sizeUp: _u, ...r } = p;
  const cert = specs?.['Zertifizierung'];
  const pend = (features ?? []).filter((x) => /in arbeit/i.test(x));
  return { ...r, eol: p.eol?.all ? { all: true, date: p.eol.date, colors: {} } : undefined, description: '', images: p.images.slice(0, 2), colors: p.colors.map((c) => ({ name: c.name, hex: c.hex, swatch: c.swatch, ...((c.images?.[0] ?? c.image) ? { image: c.images?.[0] ?? c.image } : {}) })), ...(cert ? { specs: { Zertifizierung: cert } } : {}), ...(pend.length ? { features: pend } : {}) };
}
/** Piktogramme für die Artikelseite */
export const pictosOf = (id: string) => { const p = load().byId.get(id); return p ? pictosFor(p) : { features: [], care: [], props: [] }; };

export function toPublic(p: Product, ctx?: Ctx): PublicProduct {
  const { basePrice, baseTiers, sizeExtra, hidden: _h, custom: _c, ...rest } = p;
  const price = !ctx?.locked && basePrice != null && basePrice > 0 ? sellPrice(basePrice, p.categorySlug, ctx?.markup) : null;
  // Echte Staffel-EK von L-Shop haben Vorrang – sonst Rabattstaffel auf den Verkaufspreis
  const tiers = price == null ? []
    : baseTiers?.length && !ctx?.tiers
      ? (() => {
          // L-Shop-Karton-Staffeln, darunter die normale Mengenstaffel – Preise nur fallend
          const ls = baseTiers.filter((t) => t.min > 1 && t.price > 0).sort((a, b) => a.min - b.min).map((t) => ({ min: t.min, price: sellPrice(t.price, p.categorySlug, ctx?.markup) }));
          const all = [...priceTiers(price).filter((t) => t.min < ls[0].min), ...ls].sort((a, b) => a.min - b.min);
          let last = price; return all.filter((t) => (t.price < last ? ((last = t.price), true) : false));
        })()
      : priceTiers(price, ctx?.tiers);
  const off = p.sale?.pct && p.sale.pct > 0 && p.sale.pct < 90 && price != null ? (100 - p.sale.pct) / 100 : null;
  const sp = off != null ? Math.round(price! * off * 100) / 100 : price;
  const st = off != null ? tiers.map((t) => ({ min: t.min, price: Math.round(t.price * off * 100) / 100 })) : tiers;
  // Größenaufpreis (z. B. 3XL–5XL): Differenz der Verkaufspreise, Rabatt anteilig
  const ups = price != null && sizeExtra ? Object.fromEntries(Object.entries(sizeExtra).filter(([, e]) => e > 0).map(([s, e]) => [s, Math.round((sellPrice(basePrice! + e, p.categorySlug, ctx?.markup) - price) * (off ?? 1) * 100) / 100]).filter(([, u]) => (u as number) > 0)) : null;
  return { ...rest, colors: sortColors(p.colors), price: sp, priceGross: sp != null ? gross(sp) : null, tiers: st, ...(ups && Object.keys(ups).length ? { sizeUp: ups } : {}), ...(off != null ? { was: price } : {}), rating: ratingFor(p.id), props: pictosFor(p).props, ...(hasWebp(p) ? { webp: true } : {}), ...(hasMid(p) ? { mid: true } : {}), ...(ctx?.locked ? { locked: true } : {}) };
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
  const s = load();
  const lc = id.toLowerCase();
  // id, sprechende URL – oder (nach Namensänderung) alte URL anhand der Art.-Nr. am Ende
  const p = s.byId.get(id) ?? s.bySlug.get(lc) ?? s.products.find((x) => { const k = slugify(x.sku); return !!k && (lc === k || lc.endsWith(`-${k}`)); });
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
/** Admin-Artikelauswahl: kompakt mit Kategorie, Zielgruppe und Vorschaubild */
export const pickItems = () => load().products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, brand: p.brand, category: p.category, gender: p.gender ?? 'Unisex', image: p.images[0] ?? p.colors.find((c) => c.image)?.image ?? null, colors: p.colors.length }));
export const allProductsBrief = () => load().products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, brand: p.brand, categorySlug: p.categorySlug }));

/* ---------- Sonderangebote = Auslaufartikel (ganz oder einzelne Farben/Größen) ---------- */
/** Suchbegriffe für Auslaufartikel (L-Shop-Auslaufliste) */
export const EOL_RE = /\b(auslauf\w*|restposten|abverkauf|ausverkauf|solange vorrat)\b/gi;
/** Suchbegriffe für Sonderangebote (im Admin markiert) */
export const SALE_RE = /\b(sonder\w*|angebot\w*|sale|reduziert\w*|schn(?:ä|ae)ppchen\w*|deals?|rabatt\w*|aktion(?:en|sware|spreis)?)\b/gi;
/** alt: beide zusammen (z. B. für Synonyme) */
export const DEAL_RE = new RegExp(`${EOL_RE.source}|${SALE_RE.source}`, 'gi');
const eolList = (ctx?: Ctx) => products(ctx).filter((p) => p.eol).sort((a, b) => Number(!!b.eol!.all) - Number(!!a.eol!.all));
const saleList = (ctx?: Ctx) => products(ctx).filter((p) => p.sale).sort((a, b) => (b.sale!.pct ?? 0) - (a.sale!.pct ?? 0));
export const eolProducts = (ctx?: Ctx) => eolList(ctx).map((p) => toPublic(p, ctx));
export const eolCount = (ctx?: Ctx) => eolList(ctx).length;
export const saleProducts = (ctx?: Ctx) => saleList(ctx).map((p) => toPublic(p, ctx));
export const saleCount = (ctx?: Ctx) => saleList(ctx).length;
/** Sonderangebote + Auslauf (Badge-Zähler) */
export const dealCount = (ctx?: Ctx) => eolCount(ctx) + saleCount(ctx);

export function search(q: string, limit = 48, ctx?: Ctx): PublicProduct[] {
  const s = load();
  const ok = visible(ctx);
  // „Auslaufartikel“, „Restposten“ … → Auslaufliste; „Sonderangebot“, „Sale“ … → Sonderangebote; optional weiter eingegrenzt („sonderangebot hoodie“)
  const isEol = new RegExp(EOL_RE.source, 'i').test(q), isSale = new RegExp(SALE_RE.source, 'i').test(q);
  if (isEol || isSale) {
    const rest = q.replace(new RegExp(DEAL_RE.source, 'gi'), ' ').replace(/\b(und|&|oder)\b/gi, ' ').trim();
    let list = isEol && isSale ? [...saleList(ctx), ...eolList(ctx).filter((p) => !p.sale)] : isEol ? eolList(ctx) : saleList(ctx);
    if (rest.length >= 2) { const ids = new Set(runSearch(s.index, rest, 500, s.skus)); const f = list.filter((p) => ids.has(p.id)); if (f.length) list = f; }
    return list.slice(0, limit).map((p) => toPublic(p, ctx));
  }
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

/* ---------- „Passt dazu“: Varianten (Damen/Herren/Kinder) + Kombi-Artikel ---------- */
const VARIANT_WORDS = /\b(men|women|ladies|kids|kid|junior|youth|herren|damen|kinder|unisex|baby|babiezz|girls?|boys?)\b|[´'’]s\b|\([^)]*\)/gi;
const baseName = (n: string) => n.replace(VARIANT_WORDS, ' ').replace(/[^a-z0-9äöüß ]/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const PAIRS: Record<string, string[]> = {
  'T-Shirts': ['Sweatshirts', 'Caps & Mützen', 'Jacken'], Sweatshirts: ['T-Shirts', 'Jacken', 'Hosen'], Jacken: ['Sweatshirts', 'Caps & Mützen', 'Hosen'],
  Poloshirts: ['Jacken', 'Sweatshirts', 'Caps & Mützen'], Hosen: ['Sweatshirts', 'T-Shirts', 'Jacken'], 'Hemden & Blusen': ['Jacken', 'Hosen', 'Poloshirts'],
  'Caps & Mützen': ['Caps & Mützen', 'T-Shirts', 'Sweatshirts', 'Jacken'], Accessoires: ['T-Shirts', 'Sweatshirts', 'Caps & Mützen'],
  'Taschen & Rucksäcke': ['Taschen & Rucksäcke', 'Caps & Mützen', 'T-Shirts', 'Schirme'], Schirme: ['Schirme', 'Taschen & Rucksäcke', 'Handtücher', 'Decken'],
  'Gastro & Küche': ['Gastro & Küche', 'Poloshirts', 'Hemden & Blusen', 'Caps & Mützen'], Warnschutz: ['Warnschutz', 'Arbeitskleidung', 'Jacken', 'Caps & Mützen'],
  Arbeitskleidung: ['Warnschutz', 'Jacken', 'Sweatshirts', 'T-Shirts'], Handtücher: ['Handtücher', 'Decken', 'Taschen & Rucksäcke', 'Plüsch & Spielzeug'],
  Decken: ['Decken', 'Handtücher', 'Caps & Mützen', 'Plüsch & Spielzeug'], 'Plüsch & Spielzeug': ['Plüsch & Spielzeug', 'Decken', 'Handtücher', 'Taschen & Rucksäcke'],
  Werbeartikel: ['Taschen & Rucksäcke', 'Schirme', 'Caps & Mützen'], Kleider: ['Jacken', 'Sweatshirts', 'Accessoires'], Unterwäsche: ['T-Shirts', 'Hosen', 'Accessoires'],
};
export function matchingFor(id: string, ctx?: Ctx): { variants: PublicProduct[]; combos: PublicProduct[] } {
  const all = products(ctx);
  const p = all.find((x) => x.id === id);
  if (!p) return { variants: [], combos: [] };
  const b = baseName(p.name);
  // 1. im Admin verknüpfte Artikel (in beide Richtungen), 2. gleicher Name mit anderem Schnitt
  const mine = new Set((p.pairs ?? []).map((x) => x.toUpperCase()));
  const linked = all.filter((x) => x.id !== p.id && (mine.has(x.sku.toUpperCase()) || (x.pairs ?? []).some((y) => y.toUpperCase() === p.sku.toUpperCase())));
  const auto = b.length >= 3 ? all.filter((x) => x.id !== p.id && !linked.includes(x) && x.brand === p.brand && baseName(x.name) === b && (x.gender ?? '') !== (p.gender ?? '')) : [];
  const variants = [...linked, ...auto].slice(0, 4);
  const used = new Set([p.id, ...variants.map((x) => x.id)]);
  const combos: Product[] = [];
  for (const cat of PAIRS[p.category] ?? ['T-Shirts', 'Sweatshirts', 'Caps & Mützen']) {
    // gleiche Kategorie nur mit anderer Artikelart (z. B. Cap → Beanie, Schürze → Kochjacke)
    const pool = all.filter((x) => !used.has(x.id) && x.category === cat && x.images.length && (cat !== p.category || kindOf(x) !== kindOf(p)));
    const g = (x: Product) => (x.gender ?? 'Unisex') === (p.gender ?? 'Unisex') || (x.gender ?? 'Unisex') === 'Unisex';
    // ohne gleiche Marke: abwechslungsreich, aber pro Artikel stabil auswählen
    const h = [...p.id + cat].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
    const fit = pool.filter(g);
    const pick = pool.find((x) => x.brand === p.brand && g(x)) ?? pool.find((x) => x.brand === p.brand) ?? (fit.length ? fit[h % Math.min(fit.length, 40)] : pool[h % Math.max(1, Math.min(pool.length, 40))]);
    if (pick) { combos.push(pick); used.add(pick.id); }
  }
  return { variants: variants.map((x) => toPublic(x, ctx)), combos: combos.slice(0, 4).map((x) => toPublic(x, ctx)) };
}

/** Alle sichtbaren Artikel (für Aktionsseiten) */
/** Neu im Sortiment: je Kategorie abwechselnd ein Artikel mit Bild (Tag „Neu …“) */
export function newArrivals(n = 12, ctx?: Ctx): PublicProduct[] {
  const neu = products(ctx).filter((p) => (p.tags ?? []).some((t) => /^neu\b/i.test(t)) && p.images.length);
  const by = new Map<string, Product[]>();
  for (const p of neu) { const l = by.get(p.categorySlug) ?? []; l.push(p); by.set(p.categorySlug, l); }
  const out: Product[] = []; const lists = [...by.values()];
  for (let i = 0; out.length < n && lists.some((l) => l[i]); i++) for (const l of lists) if (l[i] && out.length < n) out.push(l[i]);
  return out.map((p) => toPublic(p, ctx));
}
export const visibleProducts = (ctx?: Ctx) => products(ctx);
export const allPublic = (ctx?: Ctx) => products(ctx).map((p) => toPublic(p, ctx));
