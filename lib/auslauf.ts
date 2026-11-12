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

/** L-Shop-Auslaufliste (Zeilen inkl. Kopfzeile) → Auslaufdaten für die Artikel im Shop (wie scripts/auslauf.py) */
export function buildAuslauf(rows: string[][], products: Product[], stand: string): { stand: string; items: Record<string, Eol> } | null {
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const ci = (n: string) => head.findIndex((h) => h.startsWith(n));
  const cM = ci('masterartikel'), cF = ci('farbe'), cG = ci('größe'), cD = ci('auslaufdatum');
  if (cM < 0 || cF < 0 || cD < 0) return null;
  const nc = (c: string) => c.replace(/ \| /g, ' / ').replace(/\|/g, '/').replace(/\s+/g, ' ').trim().toLowerCase();
  const ns = (s: string) => s.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
  const toIso = (v: string) => { const n = Number(v); if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10); const g = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(v.trim()); if (g) return `${g[3]}-${g[2].padStart(2, '0')}-${g[1].padStart(2, '0')}`; if (!v || !Number.isFinite(n) || n < 20000) return null; return new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 864e5).toISOString().slice(0, 10); };
  const bySku = new Map<string, Map<string, Map<string, string | null>>>();
  for (const r of rows.slice(1)) {
    const sku = (r[cM] ?? '').trim().toUpperCase(); if (!sku) continue;
    const col = nc(r[cF] ?? ''), g = cG >= 0 ? (r[cG] ?? '').trim() : '-';
    const m = bySku.get(sku) ?? new Map(); const c = m.get(col) ?? new Map();
    c.set(g && g !== '-' ? ns(g) : 'one size', toIso(r[cD] ?? '')); m.set(col, c); bySku.set(sku, m);
  }
  const items: Record<string, Eol> = {};
  for (const p of products) {
    const disc = bySku.get(p.sku.toUpperCase()); if (!disc) continue;
    const colors: Eol['colors'] = {};
    for (const c of p.colors) {
      const e = disc.get(nc(c.name)); if (!e) continue;
      const sz = p.sizes.length ? p.sizes.filter((s) => e.has(ns(s))) : null;
      if (p.sizes.length && !sz!.length) continue;
      const dates = [...e.values()].filter((x): x is string => !!x).sort();
      colors[c.name] = { sizes: !sz || sz.length === p.sizes.length ? null : sz, date: dates.length ? dates[dates.length - 1] : null };
    }
    if (!Object.keys(colors).length) continue;
    const all = Object.keys(colors).length === p.colors.length && Object.values(colors).every((v) => !v.sizes);
    const dates = Object.values(colors).map((v) => v.date).filter((x): x is string => !!x).sort();
    items[p.sku.toUpperCase()] = { all, date: dates.length ? dates[dates.length - 1] : null, colors };
  }
  return { stand, items };
}
export function saveAuslauf(d: { stand: string; items: Record<string, Eol> }) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), 'data', 'auslauf.json'), JSON.stringify(d));
}
