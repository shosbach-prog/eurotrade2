import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

/** Herstellerangaben nach GPSR je Marke (seed/gpsr.json aus der L-Shop-Liste, erzeugt mit scripts/gpsr.py) */
export type Gpsr = { firma: string; adresse: string[]; kontakt: string[] };
let cache: { m: number; d: Record<string, Gpsr> } | null = null;
function all(): Record<string, Gpsr> {
  const f = [path.join(process.cwd(), 'data', 'gpsr.json'), path.join(process.cwd(), 'seed', 'gpsr.json')].find((x) => fs.existsSync(x));
  if (!f) return {};
  const m = fs.statSync(f).mtimeMs;
  if (!cache || cache.m !== m) { try { cache = { m, d: JSON.parse(fs.readFileSync(f, 'utf8')) }; } catch { cache = { m, d: {} }; } }
  return cache.d;
}
export function gpsrFor(brand: string): Gpsr | null {
  const d = all(); if (d[brand]) return d[brand];
  const b = brand.toLowerCase();
  const k = Object.keys(d).find((x) => x.toLowerCase() === b) ?? Object.keys(d).filter((x) => b.includes(x.toLowerCase())).sort((a, c) => c.length - a.length)[0];
  return k ? d[k] : null;
}
