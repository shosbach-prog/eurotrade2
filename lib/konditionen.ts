import 'server-only';
import { adminProduct, toPublic } from './catalog';

/** Einkaufskonditionen eines Artikels – NUR für den Admin (EK verlässt sonst nie den Server) */
export type KondRow = { min: number; ek: number; vk: number; margin: number; pct: number; markup: number };
export type Kond = { id: string; ek: number | null; vk: number | null; was?: number | null; margin: number | null; pct: number | null; markup: number | null; rows: KondRow[]; sizeExtra?: Record<string, number>; sale?: number | null };

const r2 = (n: number) => Math.round(n * 100) / 100;
const r1 = (n: number) => Math.round(n * 10) / 10;
const row = (min: number, ek: number, vk: number): KondRow => ({ min, ek: r2(ek), vk: r2(vk), margin: r2(vk - ek), pct: vk > 0 ? r1(((vk - ek) / vk) * 100) : 0, markup: ek > 0 ? r1(((vk - ek) / ek) * 100) : 0 });

export function konditionen(id: string): Kond | null {
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
  return { id, ek, vk: pub.price, was: pub.was ?? null, margin: first.margin, pct: first.pct, markup: first.markup, rows, ...(Object.keys(ups).length ? { sizeExtra: ups } : {}), sale: p.sale?.pct ?? null };
}
