import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { DATA, listReviews, type Review } from './store';

export type Rating = { avg: number; count: number };
let cache: { mtime: number; by: Map<string, Rating>; approved: Review[] } | null = null;

function load() {
  const f = path.join(DATA, 'bewertungen.json');
  const mtime = fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0;
  if (cache && cache.mtime === mtime) return cache;
  const approved = listReviews().filter((r) => r.status === 'approved').sort((a, b) => b.date.localeCompare(a.date));
  const by = new Map<string, Rating>();
  for (const r of approved) {
    const k = r.productId ?? '__shop';
    const c = by.get(k) ?? { avg: 0, count: 0 };
    c.avg = (c.avg * c.count + r.rating) / (c.count + 1); c.count++;
    by.set(k, c);
  }
  cache = { mtime, by, approved };
  return cache;
}
export const ratingFor = (productId: string) => load().by.get(productId) ?? null;
export const reviewsFor = (productId: string) => load().approved.filter((r) => r.productId === productId);
/** Gesamtbewertung über alle Bewertungen (Produkte + Shop) */
export function overall(): Rating | null {
  const a = load().approved;
  return a.length ? { avg: a.reduce((s, r) => s + r.rating, 0) / a.length, count: a.length } : null;
}
export const latestReviews = (n = 6, productIds?: string[]) => load().approved.filter((r) => r.text && (!productIds || (r.productId && productIds.includes(r.productId)))).slice(0, n);
