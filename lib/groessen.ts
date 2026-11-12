import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

/** Eigene Größentabellen (seed/groessen.json, aus den Herstellerangaben übernommen) – Maße in cm */
export type SizeTable = { sizes: string[]; head?: string; rows: [string, string, (number | string)[]][]; note?: string; shape?: 'hoodie' | 'tshirt' };
let cache: { m: number; d: Record<string, SizeTable> } | null = null;
export function sizeTableFor(sku: string): SizeTable | null {
  const f = path.join(process.cwd(), 'seed', 'groessen.json');
  try {
    const m = fs.statSync(f).mtimeMs;
    if (!cache || cache.m !== m) cache = { m, d: JSON.parse(fs.readFileSync(f, 'utf8')) };
    return cache.d[sku.toUpperCase()] ?? null;
  } catch { return null; }
}
