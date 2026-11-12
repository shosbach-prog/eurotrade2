'use client';
import { useEffect, useState } from 'react';

/**
 * Farbvorschau für Artikel ohne eigenes Farbfoto: Das Produktfoto wird im Browser auf die gewählte Farbe umgefärbt.
 * Hintergrund wird per Flood-Fill vom Rand erkannt, Struktur/Schatten bleiben über die Helligkeit erhalten.
 * Zeigt das Foto bereits (fast) die gewählte Farbe, bleibt es unverändert. Bei Fehlern: Originalfoto.
 */
const cache = new Map<string, string | null>();
const hexRgb = (h: string) => { const m = h.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null; };
const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

async function tint(src: string, hex: string): Promise<string | null> {
  const key = `${src}|${hex}`;
  if (cache.has(key)) return cache.get(key)!;
  const t = hexRgb(hex); if (!t) return null;
  const img = new Image(); img.decoding = 'async'; img.src = src;
  await img.decode();
  const s = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h); const px = d.data;
  // Hintergrund: Farbe der Ecken, Flood-Fill vom Rand mit Toleranz
  const corner = [0, w - 1, (h - 1) * w, h * w - 1].map((i) => [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]);
  const bg = [0, 1, 2].map((k) => corner.map((x) => x[k]).sort((a, b) => a - b)[1]);
  const near = (i: number) => Math.abs(px[i * 4] - bg[0]) + Math.abs(px[i * 4 + 1] - bg[1]) + Math.abs(px[i * 4 + 2] - bg[2]) < 48;
  const isBg = new Uint8Array(w * h); const stack: number[] = [];
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  while (stack.length) { const i = stack.pop()!; if (isBg[i] || !near(i)) continue; isBg[i] = 1; const x = i % w; if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1); if (i >= w) stack.push(i - w); if (i < w * (h - 1)) stack.push(i + w); }
  // eingeschlossene Hintergrundflächen (z. B. Loch im Schal): sehr nahe an der Hintergrundfarbe
  for (let i = 0; i < w * h; i++) if (!isBg[i] && Math.abs(px[i * 4] - bg[0]) + Math.abs(px[i * 4 + 1] - bg[1]) + Math.abs(px[i * 4 + 2] - bg[2]) < 22) isBg[i] = 1;
  // Haut (Model-Fotos) nicht umfärben – außer das Produkt selbst ist hautfarben (beige/sand)
  const skin = (r: number, g: number, b: number) => r > 95 && g > 40 && b > 20 && r > g && r > b && r - Math.min(g, b) > 15 && r - g > 15 && r - b < 150;
  let fg = 0, sk = 0;
  for (let i = 0; i < w * h; i++) if (!isBg[i]) { fg++; if (skin(px[i * 4], px[i * 4 + 1], px[i * 4 + 2])) sk++; }
  if (sk < fg * 0.55) for (let i = 0; i < w * h; i++) if (!isBg[i] && skin(px[i * 4], px[i * 4 + 1], px[i * 4 + 2])) isBg[i] = 2;
  // Hautmaske 3× erodieren: schmale Kanten (Mischpixel am Produktrand) werden mitgefärbt
  for (let it = 0; it < 3; it++) { const kill: number[] = []; for (let i = w; i < w * (h - 1); i++) if (isBg[i] === 2 && (isBg[i - 1] === 0 || isBg[i + 1] === 0 || isBg[i - w] === 0 || isBg[i + w] === 0)) kill.push(i); kill.forEach((i) => { isBg[i] = 0; }); }
  // Produktfläche: mittlere Farbe/Helligkeit
  let n = 0, sr = 0, sg = 0, sb = 0, sl = 0;
  for (let i = 0; i < w * h; i++) if (!isBg[i]) { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2]; sr += r; sg += g; sb += b; sl += lum(r, g, b); n++; }
  if (n < w * h * 0.05) { cache.set(key, null); return null; } // Produkt nicht erkannt (z. B. weißes Teil auf weißem Grund)
  const avg = [sr / n, sg / n, sb / n], lmean = Math.max(18, sl / n);
  if (Math.abs(avg[0] - t[0]) + Math.abs(avg[1] - t[1]) + Math.abs(avg[2] - t[2]) < 60) { cache.set(key, null); return null; } // Foto zeigt schon diese Farbe
  const tl = lum(t[0], t[1], t[2]);
  // Helligkeit relativ zum Mittelwert auf die Zielfarbe übertragen; bei sehr hellen/dunklen Zielen sanfter
  const k = tl > 200 ? 0.5 : tl < 50 ? 0.7 : 1;
  for (let i = 0; i < w * h; i++) {
    if (isBg[i]) continue;
    const o = i * 4; const f = 1 + k * (lum(px[o], px[o + 1], px[o + 2]) / lmean - 1);
    px[o] = Math.max(0, Math.min(255, t[0] * f + (f > 1 ? (f - 1) * 40 : 0)));
    px[o + 1] = Math.max(0, Math.min(255, t[1] * f + (f > 1 ? (f - 1) * 40 : 0)));
    px[o + 2] = Math.max(0, Math.min(255, t[2] * f + (f > 1 ? (f - 1) * 40 : 0)));
  }
  ctx.putImageData(d, 0, 0);
  const url = await new Promise<string | null>((r) => c.toBlob((b) => r(b ? URL.createObjectURL(b) : null), 'image/webp', 0.88));
  cache.set(key, url);
  return url;
}

export default function TintedImage({ src, hex, alt, colorName, onState }: { src: string; hex: string; alt: string; colorName: string; onState?: (tinted: boolean) => void }) {
  const [out, setOut] = useState<string | null>(null);
  useEffect(() => {
    let live = true; setOut(null); onState?.(false);
    tint(src, hex).then((u) => { if (live) { setOut(u); onState?.(!!u); } }).catch(() => { if (live) onState?.(false); });
    return () => { live = false; };
  }, [src, hex]); // eslint-disable-line react-hooks/exhaustive-deps
  return <img className="pimg" src={out ?? src} alt={out ? `${alt} – Farbvorschau ${colorName}` : alt} loading="eager" decoding="async" />;
}
