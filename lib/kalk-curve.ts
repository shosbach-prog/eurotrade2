/** Preiskurve (ohne Dateizugriff – auch im Browser für die Vorschau) */
/** Preiskurve für den Verkaufspreis: Aufschlag hängt vom Einkaufspreis ab (günstige Artikel hoher %-Aufschlag,
 *  teure Artikel ein fester Gewinn von ca. 10–30 €). Zwischen den Stützpunkten wird der Verkaufspreis gleitend berechnet,
 *  so wird ein teurerer Artikel nie billiger verkauft als ein günstigerer. */
export type Kalk = { points: { ek: number; pct: number }[]; minProfit: number; maxProfit: number; updatedAt?: string };
export const DEFAULT_KALK: Kalk = {
  points: [
    { ek: 1, pct: 600 }, { ek: 2, pct: 400 }, { ek: 3, pct: 250 }, { ek: 5, pct: 150 }, { ek: 8, pct: 100 },
    { ek: 12, pct: 70 }, { ek: 20, pct: 60 }, { ek: 30, pct: 50 }, { ek: 50, pct: 40 }, { ek: 80, pct: 30 },
  ],
  minProfit: 2, maxProfit: 30,
};
export function cleanKalk(d: any): Kalk {
  const num = (v: unknown) => { const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : 0; };
  const points = (Array.isArray(d?.points) ? d.points : []).map((p: any) => ({ ek: num(p?.ek), pct: num(p?.pct) })).filter((p: { ek: number }) => p.ek > 0).sort((a: { ek: number }, b: { ek: number }) => a.ek - b.ek).slice(0, 30);
  return { points: points.length ? points : DEFAULT_KALK.points, minProfit: num(d?.minProfit), maxProfit: num(d?.maxProfit) || DEFAULT_KALK.maxProfit };
}
/** Verkaufspreis netto (ungerundet) aus EK nach Preiskurve */
export function curvePrice(ek: number, k: Kalk): number {
  const pts = k.points.map((p) => ({ ek: p.ek, vk: p.ek * (1 + p.pct / 100) }));
  // Stützpunkte dürfen nicht fallen
  for (let i = 1; i < pts.length; i++) pts[i].vk = Math.max(pts[i].vk, pts[i - 1].vk);
  let vk: number;
  if (ek <= pts[0].ek) vk = ek * (1 + k.points[0].pct / 100);
  else if (ek >= pts[pts.length - 1].ek) { const last = k.points[k.points.length - 1]; vk = Math.max(pts[pts.length - 1].vk + (ek - pts[pts.length - 1].ek), ek * (1 + last.pct / 100)); }
  else { const i = pts.findIndex((p) => p.ek >= ek); const a = pts[i - 1], b = pts[i]; vk = a.vk + ((ek - a.ek) / (b.ek - a.ek)) * (b.vk - a.vk); }
  // Gewinn je Stück begrenzen
  vk = Math.max(vk, ek + k.minProfit);
  if (k.maxProfit > 0) vk = Math.min(vk, ek + Math.max(k.maxProfit, k.minProfit));
  return vk;
}
