import 'server-only';
import { adminProduct, toPublic } from './catalog';
import { getTeamShop, isMotifShop, teamFixedPrice } from './teamshop';
import { getPricing } from './deco-pricing-store';
import { calcDeco } from './deco-pricing';
import { MAX_PRINT_CM, spotsFor } from './deco-layout';
import type { Product } from './types';

function fixedMargin(p: Product, ek: number, slug: string): Kond['fixed'] {
  const t = getTeamShop(slug); const price = teamFixedPrice(t, p.id);
  if (!t || price == null) return null;
  const pr = getPricing(); const { spots, cm: perPct } = spotsFor(p);
  // Motiv-Shops drucken große Flächen maximal (bis MAX_PRINT_CM), sonst Standardgröße der Position
  const cmOf = (pos: string) => { const s = spots[pos]; if (!s) return 10; return s.w >= 20 && isMotifShop(t) ? MAX_PRINT_CM.w : Math.max(1, Math.round(s.w * perPct)); };
  const pos = t.positions.map((x) => ({ pos: x, cm: cmOf(x) }));
  const druckOf = (list: { pos: string; cm: number }[]) => { const c = calcDeco(pr, t.method, list, 1); return c ? Math.round(c.perPiece * pr.costPct) / 100 : 0; };
  const druck = druckOf(pos);
  const margin = Math.round((price - ek - druck) * 100) / 100;
  const back = t.backPrice && t.logoId && !t.positions.includes('Rücken') ? (() => { const d = druckOf([{ pos: 'Rücken', cm: cmOf('Rücken') }]); const m = Math.round((t.backPrice! - d) * 100) / 100; return { price: t.backPrice!, druck: d, margin: m, pct: Math.round((m / t.backPrice!) * 1000) / 10 }; })() : null;
  return { shop: t.name, price, ek, druck, margin, pct: price > 0 ? Math.round((margin / price) * 1000) / 10 : 0, costPct: pr.costPct, cm: pos.map((x) => `${x.pos} ${x.cm} cm`).join(', '), back };
}

/** Einkaufskonditionen eines Artikels – NUR für den Admin (EK verlässt sonst nie den Server) */
export type KondRow = { min: number; ek: number; vk: number; margin: number; pct: number; markup: number };
export type Kond = { id: string; ek: number | null; vk: number | null; was?: number | null; margin: number | null; pct: number | null; markup: number | null; rows: KondRow[]; sizeExtra?: Record<string, number>; sale?: number | null;
  /** Team-/Motiv-Shop mit Festpreis: Marge = Festpreis − EK − geschätzte Druckkosten */
  fixed?: { shop: string; price: number; ek: number; druck: number; margin: number; pct: number; costPct: number; cm: string; back?: { price: number; druck: number; margin: number; pct: number } | null } | null };

const r2 = (n: number) => Math.round(n * 100) / 100;
const r1 = (n: number) => Math.round(n * 10) / 10;
const row = (min: number, ek: number, vk: number): KondRow => ({ min, ek: r2(ek), vk: r2(vk), margin: r2(vk - ek), pct: vk > 0 ? r1(((vk - ek) / vk) * 100) : 0, markup: ek > 0 ? r1(((vk - ek) / ek) * 100) : 0 });

export function konditionen(id: string, teamSlug?: string | null): Kond | null {
  const { p } = adminProduct(id);
  if (!p) return null;
  const ek = p.basePrice != null && p.basePrice > 0 ? p.basePrice : null;
  const pub = toPublic(p, null); // Standardpreis (ohne Kunden-Aufschlag)
  if (ek == null || pub.price == null) return { id, ek, vk: pub.price, margin: null, pct: null, markup: null, rows: [] };
  // EK bei Menge x: echte L-Shop-Staffel-EK, sonst Basis-EK
  const ekTiers = (p.baseTiers ?? []).filter((t) => t.min > 1 && t.price > 0).sort((a, b) => a.min - b.min);
  const ekAt = (qty: number) => ekTiers.reduce((e, t) => (qty >= t.min ? t.price : e), ek);
  const mins = [...new Set([1, ...pub.tiers.map((t) => t.min), ...ekTiers.map((t) => t.min)])].sort((a, b) => a - b);
  const vkAt = (qty: number) => pub.tiers.reduce((v, t) => (qty >= t.min ? t.price : v), pub.price!);
  const rows = mins.map((m) => row(m, ekAt(m), vkAt(m)));
  const first = rows[0];
  const ups = Object.fromEntries(Object.entries(p.sizeExtra ?? {}).filter(([, e]) => e > 0));
  return { id, ek, vk: pub.price, was: pub.was ?? null, margin: first.margin, pct: first.pct, markup: first.markup, rows, fixed: teamSlug ? fixedMargin(p, ek, teamSlug) : null, ...(Object.keys(ups).length ? { sizeExtra: ups } : {}), sale: p.sale?.pct ?? null };
}
