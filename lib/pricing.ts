const markup = Number(process.env.MARKUP_PERCENT ?? 35);
const vat = Number(process.env.MWST_PERCENT ?? 19);
const round99 = (process.env.PRICE_ROUND_99 ?? 'true') === 'true';
import { parseTiers, type PriceTier, type Tier } from './tiers';
import { curvePrice } from './kalkulation';

let byCat: Record<string, number> = {};
try { byCat = JSON.parse(process.env.MARKUP_BY_CATEGORY || '{}'); } catch { byCat = {}; }

/** Standard-Aufschlag je Kategorie (Admin-Anzeige) – ohne Kategorie-Wert gilt die Preiskurve */
export const markupFor = (categorySlug: string) => byCat[categorySlug] ?? markup;
/** override = kundenspezifischer Aufschlag (Zugangscode) – hat Vorrang vor Kategorie und Standard */
export function sellPrice(basePrice: number, categorySlug: string, override?: number | null): number {
  // Kundenspezifischer Aufschlag (Zugangscode) bzw. fester Kategorie-Aufschlag aus .env haben Vorrang – sonst Preiskurve (Admin → Artikel → Kalkulation)
  if (override != null && Number.isFinite(override)) return roundPrice(basePrice * (1 + override / 100));
  if (byCat[categorySlug] != null) return roundPrice(basePrice * (1 + byCat[categorySlug] / 100));
  return roundPrice(curvePrice(basePrice));
}
function roundPrice(p: number) {
  if (round99 && p >= 1) p = Math.ceil(p * 10) / 10 - 0.01; // z. B. 4,23 -> 4,29
  return Math.round(p * 100) / 100;
}
/** Standard-Staffel aus .env (PRICE_TIERS="10:5,50:10,100:15"; leer = keine Staffel) */
export const defaultTiers = (): Tier[] => parseTiers(process.env.PRICE_TIERS ?? '10:5,50:10,100:15');
/** Staffelpreise zum Stückpreis – eigene Kunden-Staffel ("-" = keine) hat Vorrang */
export function priceTiers(unit: number, custom?: string | null): PriceTier[] {
  const t = custom?.trim() === '-' ? [] : custom?.trim() ? parseTiers(custom) : defaultTiers();
  return t.map((x) => ({ min: x.min, price: roundPrice(unit * (1 - x.pct / 100)) })).filter((x) => x.price < unit);
}
export const gross = (net: number) => Math.round(net * (1 + vat / 100) * 100) / 100;
export const VAT = vat;
