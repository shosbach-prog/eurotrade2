import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { Eol, Product } from './types';

/** L-Shop-Auslaufliste (seed/auslauf.json, erzeugt mit scripts/auslauf.py; data/auslauf.json hat Vorrang) */
type File = { stand?: string; items: Record<string, Eol> };
let cache: { m: string; d: File } | null = null;
export function auslauf(): File {
  const fs2 = [path.join(process.cwd(), 'data', 'auslauf.json'), path.join(process.cwd(), 'seed', 'auslauf.json')];
  const f = fs2.find((x) => fs.existsSync(x));
  if (!f) return { items: {} };
  const m = `${f}|${fs.statSync(f).mtimeMs}`;
  if (!cache || cache.m !== m) { try { cache = { m, d: JSON.parse(fs.readFileSync(f, 'utf8')) }; } catch { cache = { m, d: { items: {} } }; } }
  return cache.d;
}
export const auslaufMtime = () => { const f = [path.join(process.cwd(), 'data', 'auslauf.json'), path.join(process.cwd(), 'seed', 'auslauf.json')].find((x) => fs.existsSync(x)); return f ? fs.statSync(f).mtimeMs : 0; };

/** Auslaufdaten anwenden: Abgelaufenes ausblenden (Artikel, Farben, Varianten), Rest als Hinweis am Artikel */
export function applyEol(p: Product, today = new Date().toISOString().slice(0, 10)): Product {
  const e = auslauf().items[p.sku.toUpperCase()];
  if (!e) return p;
  const gone = (d: string | null) => !!d && d < today;
  if (e.all && gone(e.date)) return { ...p, hidden: true };
  let colors = p.colors; const stockBy = { ...(p.stockBy ?? {}) }; const left: Eol['colors'] = {};
  for (const [name, c] of Object.entries(e.colors)) {
    if (!gone(c.date)) { left[name] = c; continue; }
    if (!c.sizes) colors = colors.filter((x) => x.name !== name);
    else for (const s of c.sizes) stockBy[`${name}|${s}`] = 0;
  }
  if (!colors.length) return { ...p, hidden: true };
  return { ...p, colors, ...(Object.keys(stockBy).length ? { stockBy } : {}), eol: Object.keys(left).length ? { all: e.all, date: e.date, colors: left } : undefined };
}
