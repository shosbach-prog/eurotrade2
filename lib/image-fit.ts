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

/* ---------- Lage-Anker je Foto und Position: [x, y, Breite, Drehung] in % der Bühne ----------
   seed/image-anchor.json (mitgeliefert) + data/image-anchor.json (im Shop als Admin gespeichert, hat Vorrang) */
export type Anchor = [number, number, number, number];
type Anchors = Record<string, Record<string, Anchor>>;
const ANCHOR_DATA = path.join(process.cwd(), 'data', 'image-anchor.json');
const readA = (f: string): Anchors => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; } };
let acache: { m: string; d: Anchors } | null = null;
function anchors(): Anchors {
  const fs2 = [path.join(process.cwd(), 'seed', 'image-anchor.json'), ANCHOR_DATA];
  const m = fs2.map((f) => (fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0)).join('|');
  if (!acache || acache.m !== m) {
    const a = readA(fs2[0]), b = readA(fs2[1]);
    const d: Anchors = { ...a };
    for (const [k, v] of Object.entries(b)) d[k] = { ...(d[k] ?? {}), ...v };
    acache = { m, d };
  }
  return acache.d;
}
export function anchorsFor(p: { images: string[]; colors: { image?: string }[] }): Record<string, Record<string, Anchor>> {
  const d = anchors(); const out: Record<string, Record<string, Anchor>> = {};
  for (const s of [...p.images, ...p.colors.map((c) => c.image)]) if (s && d[s]) out[s] = d[s];
  return out;
}
export function saveAnchor(src: string, pos: string, a: Anchor | null) {
  const d = readA(ANCHOR_DATA);
  if (a) d[src] = { ...(d[src] ?? {}), [pos]: a.map((n) => Math.round(n * 100) / 100) as Anchor };
  else if (d[src]) { delete d[src][pos]; if (!Object.keys(d[src]).length) delete d[src]; }
  fs.mkdirSync(path.dirname(ANCHOR_DATA), { recursive: true });
  fs.writeFileSync(ANCHOR_DATA, JSON.stringify(d));
}
