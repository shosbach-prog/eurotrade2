import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import { UPLOADS } from './store';

/** Erlaubte Vorschau-Breiten (px) – feste Stufen, damit der Cache klein bleibt */
export const THUMB_W = [160, 320, 640, 1000] as const;
const DIR = path.join(UPLOADS, '_thumbs');

/** Kleinste erlaubte Stufe ≥ gewünschter Breite */
export const thumbWidth = (w: number) => THUMB_W.find((x) => x >= w) ?? THUMB_W[THUMB_W.length - 1];

/** Verkleinertes Bild eines Uploads (WebP mit Transparenz; Fallback PNG/JPEG). Ergebnis wird auf der Platte zwischengespeichert. */
export async function thumb(id: string, ext: string, file: string, w: number): Promise<{ data: Buffer; type: string } | null> {
  if (!/^(png|jpe?g|webp)$/i.test(ext)) return null;
  fs.mkdirSync(DIR, { recursive: true });
  for (const [e, type] of [['webp', 'image/webp'], ['png', 'image/png'], ['jpg', 'image/jpeg']] as const) {
    const f = path.join(DIR, `${id}-${w}.${e}`);
    if (fs.existsSync(f)) return { data: fs.readFileSync(f), type };
  }
  const src = fs.readFileSync(file);
  // 1) sharp (schnell, WebP)
  try {
    const sharp = (await import('sharp')).default;
    const data = await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90, effort: 4 }).toBuffer();
    fs.writeFileSync(path.join(DIR, `${id}-${w}.webp`), data);
    return { data, type: 'image/webp' };
  } catch { /* sharp nicht verfügbar → reines JS */ }
  // 2) Fallback: PNG/JPEG per Box-Filter verkleinern
  try {
    const isPng = /png/i.test(ext);
    if (!isPng && !/jpe?g/i.test(ext)) return null;
    const img = isPng ? PNG.sync.read(src) : jpeg.decode(src, { useTArray: true, maxMemoryUsageInMB: 512 });
    const { width: W, height: H } = img; const s = img.data as Uint8Array;
    if (W <= w) return null;
    const h = Math.max(1, Math.round((H * w) / W));
    const out = new PNG({ width: w, height: h });
    const fx = W / w, fy = H / h;
    for (let y = 0; y < h; y++) {
      const y0 = Math.floor(y * fy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * fy));
      for (let x = 0; x < w; x++) {
        const x0 = Math.floor(x * fx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * fx));
        let r = 0, g = 0, b = 0, a = 0, n = 0;
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
          const i = (yy * W + xx) * 4; const al = s[i + 3];
          r += s[i] * al; g += s[i + 1] * al; b += s[i + 2] * al; a += al; n++;
        }
        const o = (y * w + x) * 4;
        out.data[o] = a ? r / a : 0; out.data[o + 1] = a ? g / a : 0; out.data[o + 2] = a ? b / a : 0; out.data[o + 3] = a / n;
      }
    }
    if (isPng) { const data = PNG.sync.write(out); fs.writeFileSync(path.join(DIR, `${id}-${w}.png`), data); return { data, type: 'image/png' }; }
    const data = Buffer.from(jpeg.encode({ data: out.data, width: w, height: h }, 82).data);
    fs.writeFileSync(path.join(DIR, `${id}-${w}.jpg`), data);
    return { data, type: 'image/jpeg' };
  } catch { return null; }
}
