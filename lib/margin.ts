import 'server-only';
import path from 'node:path';
import { adminProduct } from './catalog';
import { DEFAULT_PRICING, cleanPricing } from './deco-pricing';
import { DATA, readJSON, type Inquiry } from './store';

const DECO = /^(Veredelung|Stickprogramm|Einrichtung|Personalisierung|Mindermengen|Druck|Stick)/i;
export type Margin = { revenue: number; textileCost: number; decoRevenue: number; decoCost: number; margin: number; pct: number; missingEk: number; costPct: number };

/** Geschätzte Marge eines Auftrags: Angebot netto (ohne Versand) − EK Textil − Kosten Veredelung (% aus Admin → Veredelung) */
export function inquiryMargin(i: Inquiry): Margin | null {
  if (!i.offer) return null;
  const raw = readJSON<unknown>(path.join(DATA, 'veredelung.json'), null);
  const costPct = (raw ? cleanPricing(raw) : DEFAULT_PRICING).costPct;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const revenue = r2(i.offer.lines.reduce((s, l) => s + l.qty * l.price, 0));
  const decoRevenue = r2(i.offer.lines.filter((l) => DECO.test(l.text)).reduce((s, l) => s + l.qty * l.price, 0));
  let textileCost = 0, missingEk = 0;
  for (const l of i.lines) {
    const ek = l.ek ?? (l.id ? adminProduct(l.id).p?.basePrice : null) ?? null;
    if (ek == null) missingEk += l.qty; else textileCost += ek * l.qty;
  }
  textileCost = r2(textileCost);
  const decoCost = r2((decoRevenue * costPct) / 100);
  const margin = r2(revenue - textileCost - decoCost);
  return { revenue, textileCost, decoRevenue, decoCost, margin, pct: revenue > 0 ? Math.round((margin / revenue) * 1000) / 10 : 0, missingEk, costPct };
}
