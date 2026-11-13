'use client';
// Live-Vorschau als Bild (PNG) – wird beim Hinzufügen zum Warenkorb hochgeladen und hängt an Anfrage, Angebot und PDF
import { colorHex, fontCss } from '@/lib/deco';
import { anchorTf, ident, photoTf, shapeFor, type Anchor, type FitT, type Place, type Tf } from './DecoStudio';

type Opts = {
  product: { category?: string; name?: string }; colorHex?: string; photo?: string | null; fit?: FitT | null; anchor?: Record<string, Anchor> | null;
  positions: string[]; place: Place; logoSrc?: string | null; logoFor?: Record<string, string> | null; text?: string; font?: string; textColor?: string; method: string;
};
const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

async function renderView(o: Opts, view: 'front' | 'back', N = 900): Promise<Blob | null> {
  const { kind, spots, shape, hoodie } = shapeFor(o.product);
  const pos = o.positions.filter((p) => spots[p]?.view === view && o.place[p]);
  if (!pos.length) return null;
  const c = document.createElement('canvas'); c.width = N; c.height = N;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, N, N);
  let tf = ident;
  const inset = N * 0.04, box = N * 0.92;
  let photoOk = false;
  if (view === 'front' && o.photo && (o.fit || o.anchor)) {
    try {
      const im = await load(o.photo);
      const sc = Math.min(box / im.width, box / im.height);
      g.drawImage(im, inset + (box - im.width * sc) / 2, inset + (box - im.height * sc) / 2, im.width * sc, im.height * sc);
      tf = o.fit ? photoTf(kind, o.fit, hoodie) : ident; photoOk = true;
    } catch {}
  }
  if (!photoOk) {
    g.save(); g.translate(inset, inset); g.scale(box / 100, box / 100);
    for (const d of view === 'back' && shape.back ? shape.back : shape.front) { const p = new Path2D(d); g.fillStyle = o.colorHex ?? '#d9dde3'; g.fill(p); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.5; g.stroke(p); }
    if (view === 'front') for (const d of shape.detail ?? []) { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.5; g.stroke(new Path2D(d)); }
    g.restore();
  }
  const tfOf = (p: string): Tf => (photoOk && o.anchor?.[p] && spots[p] ? anchorTf(spots[p], o.anchor[p]) : tf);
  let t: Tf = tf;
  const X = (x: number) => ((t.ox + (x - 50) * t.s) / 100) * N, Y = (y: number) => ((t.oy + (y - t.rt) * t.s) / 100) * N;
  const cache = new Map<string, HTMLImageElement | null>();
  const getLogo = async (src?: string | null) => { if (!src) return null; if (!cache.has(src)) cache.set(src, await load(src).catch(() => null)); return cache.get(src)!; };
  const lines = (o.text ?? '').split('\n').filter((l) => l.trim());
  const longest = Math.max(1, ...lines.map((l) => l.length));
  for (const p of pos) {
    const pl = o.place[p]; t = tfOf(p);
    const logo = await getLogo(o.logoFor?.[p] ?? o.logoSrc);
    const w = (pl.w * t.s / 100) * N, cx = X(pl.x), cy = Y(pl.y);
    g.save(); if (t.rot) { g.translate(cx, cy); g.rotate((t.rot * Math.PI) / 180); g.translate(-cx, -cy); }
    const lh = lines.length ? Math.min(0.34, 1.5 / longest) * w : 0;
    const lw = logo ? w : 0;
    const lhgt = logo ? lw * (logo.height / logo.width) : 0;
    const total = lhgt + (lines.length ? lines.length * lh * 1.05 + (logo ? w * 0.04 : 0) : 0);
    let y = cy - total / 2;
    if (logo) { g.drawImage(logo, cx - lw / 2, y, lw, lhgt); y += lhgt + (lines.length ? w * 0.04 : 0); }
    if (lines.length) {
      g.fillStyle = colorHex(o.textColor); g.textAlign = 'center'; g.textBaseline = 'top';
      g.font = `700 ${lh}px ${fontCss(o.font)}`;
      for (const l of lines) { g.fillText(l, cx, y, w); y += lh * 1.05; }
    }
    g.restore();
  }
  // Hinweis unten
  g.fillStyle = 'rgba(20,24,31,.55)'; g.font = `500 ${N * 0.022}px Arial, sans-serif`; g.textAlign = 'left'; g.textBaseline = 'bottom';
  g.fillText(`${view === 'front' ? 'Vorderseite' : 'Rückseite'} · ${o.method} · ${pos.join(', ')}`, N * 0.03, N * 0.985);
  return await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
}

/** Vorschaubilder erzeugen und hochladen – liefert Upload-IDs (leer bei Fehler) */
export async function uploadPreviews(o: Opts): Promise<string[]> {
  const ids: string[] = [];
  for (const v of ['front', 'back'] as const) {
    try {
      const b = await renderView(o, v);
      if (!b) continue;
      const fd = new FormData(); fd.append('file', new File([b], `vorschau-${v === 'front' ? 'vorne' : 'hinten'}.png`, { type: 'image/png' }));
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.id) ids.push(d.id);
    } catch {}
  }
  return ids;
}
