import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_KALK, cleanKalk, curvePrice as curve, type Kalk } from './kalk-curve';
export { DEFAULT_KALK, cleanKalk, type Kalk } from './kalk-curve';

const FILE = path.join(process.cwd(), 'data', 'kalkulation.json');
let cache: { m: number; d: Kalk } | null = null;
export function getKalk(): Kalk {
  try {
    const m = fs.statSync(FILE).mtimeMs;
    if (!cache || cache.m !== m) cache = { m, d: cleanKalk(JSON.parse(fs.readFileSync(FILE, 'utf8'))) };
    return cache.d;
  } catch { return DEFAULT_KALK; }
}
export function saveKalk(k: Kalk) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify({ ...cleanKalk(k), updatedAt: new Date().toISOString() })); cache = null; }

/** Verkaufspreis netto (ungerundet) nach gespeicherter Preiskurve */
export const curvePrice = (ek: number) => curve(ek, getKalk());
