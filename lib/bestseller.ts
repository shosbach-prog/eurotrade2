import 'server-only';
import { getFeatured, getProduct, slimCard, type Ctx } from './catalog';
import { listInquiries } from './store';
import type { PublicProduct } from './types';

let cache: { at: number; ids: string[] } | null = null;
/** Bestseller: am häufigsten angefragte Artikel (Menge der letzten 12 Monate), aufgefüllt mit Top-Artikeln – max. 2 je Kategorie */
export function bestsellers(n = 12, ctx?: Ctx): PublicProduct[] {
  if (!cache || Date.now() - cache.at > 10 * 60_000) {
    const since = Date.now() - 365 * 864e5;
    const score = new Map<string, number>();
    for (const i of listInquiries()) {
      if (Date.parse(i.date) < since) continue;
      for (const l of i.lines) if (l.id && !l.sample) score.set(l.id, (score.get(l.id) ?? 0) + 1 + Math.min(l.qty, 50) / 50);
    }
    cache = { at: Date.now(), ids: [...score.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id) };
  }
  const out: PublicProduct[] = []; const perCat = new Map<string, number>();
  const add = (p: PublicProduct | null | undefined) => {
    if (!p || out.length >= n || out.some((x) => x.id === p.id) || !p.images.length) return;
    const c = perCat.get(p.categorySlug) ?? 0; if (c >= 2) return;
    perCat.set(p.categorySlug, c + 1); out.push(slimCard(p));
  };
  cache.ids.forEach((id) => add(getProduct(id, ctx)));
  getFeatured(80, ctx).sort((a, b) => (b.rating?.count ?? 0) - (a.rating?.count ?? 0)).forEach(add);
  return out;
}
