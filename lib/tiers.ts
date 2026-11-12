// Staffelpreise – client- und serverseitig nutzbar (kein process.env hier)
export type Tier = { min: number; pct: number };
export type PriceTier = { min: number; price: number };

/** "10:5,50:10,100:15" -> ab 10 Stk. 5 %, ab 50 Stk. 10 %, ab 100 Stk. 15 % Rabatt */
export function parseTiers(s?: string | null): Tier[] {
  return String(s ?? '').split(',').map((x) => x.split(':').map((y) => Number(y.trim().replace(',', '.'))))
    .filter(([m, p]) => m > 1 && p > 0 && p < 90).map(([min, pct]) => ({ min: Math.floor(min), pct }))
    .sort((a, b) => a.min - b.min);
}
export const tiersToString = (t: Tier[]) => t.map((x) => `${x.min}:${x.pct}`).join(',');

/** Stückpreis für eine Gesamtmenge (alle Farben/Größen eines Artikels zusammen) */
export function unitFor(tiers: PriceTier[] | undefined, qty: number, fallback: number | null): number | null {
  if (fallback == null) return null;
  let p = fallback;
  for (const t of tiers ?? []) if (qty >= t.min) p = t.price;
  return p;
}
/** Stückpreis inkl. Größenaufpreis (z. B. 3XL) */
export function sizeUnit(tiers: PriceTier[] | undefined, qty: number, fallback: number | null, ups?: Record<string, number>, size?: string | null): number | null {
  const u = unitFor(tiers, qty, fallback);
  return u == null ? null : Math.round((u + ((size && ups?.[size]) || 0)) * 100) / 100;
}
/** nächste Staffel, die noch nicht erreicht ist */
export const nextTier = (tiers: PriceTier[] | undefined, qty: number) => (tiers ?? []).find((t) => t.min > qty) ?? null;
