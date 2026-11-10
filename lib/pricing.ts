const markup = Number(process.env.MARKUP_PERCENT ?? 35);
const vat = Number(process.env.MWST_PERCENT ?? 19);
const round99 = (process.env.PRICE_ROUND_99 ?? 'true') === 'true';
let byCat: Record<string, number> = {};
try { byCat = JSON.parse(process.env.MARKUP_BY_CATEGORY || '{}'); } catch { byCat = {}; }

/** override = kundenspezifischer Aufschlag (Zugangscode) – hat Vorrang vor Kategorie und Standard */
export function sellPrice(basePrice: number, categorySlug: string, override?: number | null): number {
  const pct = override != null && Number.isFinite(override) ? override : byCat[categorySlug] ?? markup;
  let p = basePrice * (1 + pct / 100);
  if (round99 && p >= 1) p = Math.ceil(p * 10) / 10 - 0.01; // z. B. 4,23 -> 4,29
  return Math.round(p * 100) / 100;
}
export const gross = (net: number) => Math.round(net * (1 + vat / 100) * 100) / 100;
export const VAT = vat;
