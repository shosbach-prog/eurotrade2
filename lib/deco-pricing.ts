// Kalkulation Veredelung (Stick / Druck) – reine Rechenlogik, nutzbar in Shop und Admin
export type SizeClass = { label: string; maxCm: number };
export type MethodPrices = {
  sizes: SizeClass[];          // Größenklassen nach Motivbreite
  tiers: number[];             // Mengenstufen (ab Stück), z. B. [1, 10, 25, 50, 100]
  prices: number[][];          // [Größe][Stufe] Preis netto je Stück und Position
  setup: number[];             // je Größe: einmalige Einrichtung (z. B. Stickprogramm) je Position
  setupLabel: string;          // z. B. „Stickprogramm“
};
export type DecoPricing = { stick: MethodPrices; druck: MethodPrices; minOrder: number; showEstimate: boolean; /** Personalisierung je Teil (netto) */ team: { name: number; nummer: number }; updatedAt?: string };

export const DEFAULT_PRICING: DecoPricing = {
  stick: {
    sizes: [{ label: 'bis 8 cm', maxCm: 8 }, { label: 'bis 12 cm', maxCm: 12 }, { label: 'bis 20 cm', maxCm: 20 }, { label: 'bis 30 cm', maxCm: 30 }],
    tiers: [1, 10, 25, 50, 100],
    prices: [[6.5, 4.9, 3.9, 3.2, 2.8], [8.5, 6.5, 5.2, 4.4, 3.8], [12.9, 9.9, 7.9, 6.9, 5.9], [18.9, 14.9, 11.9, 9.9, 8.5]],
    setup: [29, 39, 59, 89], setupLabel: 'Stickprogramm',
  },
  druck: {
    sizes: [{ label: 'bis 10 cm', maxCm: 10 }, { label: 'bis 15 cm (A6)', maxCm: 15 }, { label: 'bis 21 cm (A5)', maxCm: 21 }, { label: 'bis 30 cm (A4)', maxCm: 30 }, { label: 'bis 42 cm (A3)', maxCm: 42 }],
    tiers: [1, 10, 25, 50, 100],
    prices: [[4.9, 3.9, 3.2, 2.7, 2.3], [5.9, 4.7, 3.9, 3.3, 2.9], [7.9, 6.2, 5.2, 4.5, 3.9], [10.9, 8.5, 7.2, 6.2, 5.4], [14.9, 11.9, 9.9, 8.5, 7.5]],
    setup: [0, 0, 0, 0, 0], setupLabel: 'Einrichtung',
  },
  minOrder: 0,
  team: { name: 4.5, nummer: 3.5 },
  showEstimate: true,
};

export type CalcLine = { pos: string; cm: number; size: string; unit: number; setup: number; tooBig: boolean };
export type Calc = { method: 'Stick' | 'Druck'; qty: number; lines: CalcLine[]; perPiece: number; setupTotal: number; total: number; minApplied: number };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Preis je Position: Größenklasse nach cm, Stufe nach Gesamtmenge */
export function calcDeco(pr: DecoPricing, method: string, positions: { pos: string; cm: number }[], qty: number): Calc | null {
  const key = method === 'Stick' ? 'stick' : method === 'Druck' ? 'druck' : null;
  if (!key || !positions.length) return null;
  const m = pr[key];
  const q = Math.max(1, Math.floor(qty) || 1);
  let t = 0; m.tiers.forEach((min, k) => { if (q >= min) t = k; });
  const lines = positions.map(({ pos, cm }) => {
    let s = m.sizes.findIndex((x) => cm <= x.maxCm);
    const tooBig = s < 0; if (tooBig) s = m.sizes.length - 1;
    return { pos, cm, size: m.sizes[s]?.label ?? '', unit: r2(m.prices[s]?.[t] ?? 0), setup: r2(m.setup[s] ?? 0), tooBig };
  });
  const perPiece = r2(lines.reduce((a, l) => a + l.unit, 0));
  const setupTotal = r2(lines.reduce((a, l) => a + l.setup, 0));
  const raw = r2(perPiece * q + setupTotal);
  const total = Math.max(raw, pr.minOrder || 0);
  return { method: key === 'stick' ? 'Stick' : 'Druck', qty: q, lines, perPiece, setupTotal, total: r2(total), minApplied: total > raw ? r2(total - raw) : 0 };
}

/** Eingaben aus dem Admin prüfen */
export function cleanPricing(d: any): DecoPricing {
  const num = (v: unknown, max = 100000) => { const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) && n >= 0 ? r2(Math.min(n, max)) : 0; };
  const meth = (m: any, def: MethodPrices): MethodPrices => {
    const sizes: SizeClass[] = (Array.isArray(m?.sizes) ? m.sizes : def.sizes).slice(0, 12).map((s: any) => ({ label: String(s?.label ?? '').slice(0, 40) || `bis ${num(s?.maxCm)} cm`, maxCm: num(s?.maxCm, 200) })).filter((s: SizeClass) => s.maxCm > 0);
    const rawT: number[] = (Array.isArray(m?.tiers) ? m.tiers : def.tiers).slice(0, 10).map((x: unknown) => Math.max(1, Math.floor(num(x))));
    const tOrder = rawT.map((q, j) => [q, j] as const).sort((a, b) => a[0] - b[0]).filter((x, i, a) => i === 0 || x[0] !== a[i - 1][0]);
    if (!tOrder.length || tOrder[0][0] !== 1) tOrder.unshift([1, -1]);
    const tiers = tOrder.map(([q]) => q);
    const order = sizes.map((s, k) => [s, k] as const).sort((a, b) => a[0].maxCm - b[0].maxCm);
    const prices = order.map(([, k]) => tOrder.map(([, j]) => num(m?.prices?.[k]?.[j < 0 ? 0 : j])));
    const setup = order.map(([, k]) => num(m?.setup?.[k]));
    return { sizes: order.map(([s]) => s), tiers, prices, setup, setupLabel: String(m?.setupLabel ?? def.setupLabel).slice(0, 40) || def.setupLabel };
  };
  return { stick: meth(d?.stick, DEFAULT_PRICING.stick), druck: meth(d?.druck, DEFAULT_PRICING.druck), minOrder: num(d?.minOrder), showEstimate: d?.showEstimate !== false, team: { name: d?.team ? num(d.team.name) : DEFAULT_PRICING.team.name, nummer: d?.team ? num(d.team.nummer) : DEFAULT_PRICING.team.nummer } };
}

/** Preis der Personalisierung je Teil */
export const teamUnit = (pr: DecoPricing, what?: string) => (what === 'name' ? pr.team.name : what === 'nummer' ? pr.team.nummer : pr.team.name + pr.team.nummer);
