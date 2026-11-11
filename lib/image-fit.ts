import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

/** Ergebnis der Bildanalyse (scripts/image-fit.py): Lage des Artikels im Foto, in % der quadratischen Vorschau-Bühne
 *  [oben, Schulter, Schulter bei Kapuze, unten, Mittelachse] */
export type Fit = [number, number, number, number, number];
let cache: { m: number; d: Record<string, Fit> } | null = null;

function load(): Record<string, Fit> {
  const f = [path.join(process.cwd(), 'data', 'image-fit.json'), path.join(process.cwd(), 'seed', 'image-fit.json')].find((x) => fs.existsSync(x));
  if (!f) return {};
  const m = fs.statSync(f).mtimeMs;
  if (!cache || cache.m !== m) { try { cache = { m, d: JSON.parse(fs.readFileSync(f, 'utf8')) }; } catch { cache = { m, d: {} }; } }
  return cache.d;
}

/** Bildanalyse für alle Fotos eines Artikels */
export function fitsFor(p: { images: string[]; colors: { image?: string }[] }): Record<string, Fit> {
  const d = load(); const out: Record<string, Fit> = {};
  for (const s of [...p.images, ...p.colors.map((c) => c.image)]) if (s && d[s]) out[s] = d[s];
  return out;
}
