'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import ProductImage from './ProductImage';
import type { PublicProduct } from '@/lib/types';

/** L-Shop: 665px-Vorschau -> Originalbild für den Zoom */
import { mid, webp } from '@/lib/img';
export const hiRes = (src: string) => src.replace(/\/generated\/product\/(\d+)\/\d+_\d+_\d+\//, '/master/product/$1/');
const Z = 2.6; // Zoomfaktor

type Props = { p: PublicProduct; hex?: string; overlay?: ReactNode; /** gesteuertes Bild (z. B. bei Farbwahl) */ index?: number; /** Bildwechsel durch Blättern */ onIndex?: (i: number) => void; /** Farbe ohne eigenes Foto: Hinweis mit Farbfeld, Foto bleibt unverändert */ tint?: { hex: string; name: string } };

/** Produktgalerie wie bei Amazon: Thumbnails per Hover, Lupe mit Zoomfenster neben dem Bild, Vollbild per Klick */
export default function Gallery({ p, hex, overlay, tint, index, onIndex }: Props) {
  const imgs = p.webp ? p.images.map((x) => webp(x, true)!) : p.images;
  const thumbs = p.images.map((x) => mid(x, p.mid, p.webp)!);
  const [i, setI] = useState(index ?? 0);
  useEffect(() => { if (index != null && index >= 0 && index < imgs.length) setI(index); }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const first = useRef(true);
  const hover = useRef(false);
  useEffect(() => { if (first.current) { first.current = false; return; } if (hover.current) { hover.current = false; return; } if (i !== index) onIndex?.(i); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const [zoom, setZoom] = useState<{ lx: number; ly: number; lw: number; lh: number; bx: number; by: number; bw: number; bh: number } | null>(null);
  const [full, setFull] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const swiped = useRef(0);
  const src = imgs[i];

  // Hi-Res vorladen, damit der Zoom sofort scharf ist
  useEffect(() => { if (src) { const im = new Image(); im.src = hiRes(src); } }, [src]);
  useEffect(() => {
    if (!full) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFull(false);
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % imgs.length);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + imgs.length) % imgs.length);
    };
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [full, imgs.length]);

  function move(e: React.MouseEvent) {
    const el = box.current?.querySelector('img.pimg') as HTMLImageElement | null;
    if (!el || !el.naturalWidth || window.matchMedia('(hover: none), (max-width: 820px)').matches) return;
    const r = el.getBoundingClientRect();
    // tatsächlich sichtbare Bildfläche (object-fit: contain)
    const s = Math.min(r.width / el.naturalWidth, r.height / el.naturalHeight);
    const w = el.naturalWidth * s, h = el.naturalHeight * s;
    const ox = r.left + (r.width - w) / 2, oy = r.top + (r.height - h) / 2;
    const x = e.clientX - ox, y = e.clientY - oy;
    if (x < 0 || y < 0 || x > w || y > h) { setZoom(null); return; }
    const pane = r.width; // Zoomfenster = so groß wie die Galerie
    const lw = Math.min(w, pane / Z), lh = Math.min(h, pane / Z);
    const lx = Math.max(0, Math.min(w - lw, x - lw / 2)), ly = Math.max(0, Math.min(h - lh, y - lh / 2));
    setZoom({ lx: lx + (r.width - w) / 2, ly: ly + (r.height - h) / 2, lw, lh, bx: -lx * Z, by: -ly * Z, bw: w * Z, bh: h * Z });
  }

  return (
    <div className="gal">
      <div className="gal-main">
        {imgs.length > 1 && (
          <div className="gal-thumbs" onMouseLeave={() => { if (index != null && i !== index) { hover.current = true; setI(index); } }}>
            {imgs.map((t, k) => (
              <button key={t} className={k === i ? 'on' : ''} onMouseEnter={() => { if (k !== i) { hover.current = true; setI(k); } }} onFocus={() => setI(k)} onClick={() => { hover.current = false; if (k === i) onIndex?.(k); else setI(k); }} aria-label={`Bild ${k + 1}`}>
                <img src={thumbs[k] ?? t} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
        <div ref={box} className={`gallery ${src ? 'zoomable' : ''}`} onMouseMove={src ? move : undefined} onMouseLeave={() => setZoom(null)}
          onTouchStart={(e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY, moved: false }; }}
          onTouchEnd={(e) => {
            const s = touch.current; touch.current = null; if (!s || imgs.length < 2) return;
            const t = e.changedTouches[0]; const dx = t.clientX - s.x, dy = t.clientY - s.y;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { e.preventDefault(); setI((x) => (x + (dx < 0 ? 1 : -1) + imgs.length) % imgs.length); swiped.current = Date.now(); }
          }}
          onClick={() => src && Date.now() - swiped.current > 400 && setFull(true)}>
          <ProductImage p={p} src={src} hex={hex} priority={i === 0} />
          {tint && <span className="gal-tint"><i style={{ background: tint.hex }} />{tint.name} – Foto zeigt eine andere Farbe</span>}
          {overlay}
          {imgs.length > 1 && <>
            <button type="button" className="gal-nav l" aria-label="Vorheriges Bild" onClick={(e) => { e.stopPropagation(); setZoom(null); setI((x) => (x - 1 + imgs.length) % imgs.length); }} onMouseMove={(e) => { e.stopPropagation(); setZoom(null); }}>‹</button>
            <button type="button" className="gal-nav r" aria-label="Nächstes Bild" onClick={(e) => { e.stopPropagation(); setZoom(null); setI((x) => (x + 1) % imgs.length); }} onMouseMove={(e) => { e.stopPropagation(); setZoom(null); }}>›</button>
            <span className="gal-count">{i + 1} / {imgs.length}</span>
          </>}
          {zoom && <div className="gal-lens" style={{ left: zoom.lx, top: zoom.ly, width: zoom.lw, height: zoom.lh }} />}
        </div>
        {zoom && src && <div className="gal-zoom" style={{ backgroundImage: `url("${hiRes(src)}"), url("${src}")`, backgroundSize: `${zoom.bw}px ${zoom.bh}px`, backgroundPosition: `${zoom.bx}px ${zoom.by}px` }} />}
      </div>
      {src && <p className="gal-hint">{imgs.length > 1 ? 'Mit der Maus über Bild fahren zum Vergrößern · Klick für Vollbild' : 'Mit der Maus über Bild fahren zum Vergrößern'}</p>}

      {full && src && typeof document !== 'undefined' && createPortal(
        <div className="lightbox" onClick={() => Date.now() - swiped.current > 400 && setFull(false)} role="dialog" aria-modal="true"
          onTouchStart={(e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY, moved: false }; }}
          onTouchEnd={(e) => { const s = touch.current; touch.current = null; if (!s || imgs.length < 2) return; const t = e.changedTouches[0]; const dx = t.clientX - s.x; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(t.clientY - s.y)) { setI((x) => (x + (dx < 0 ? 1 : -1) + imgs.length) % imgs.length); swiped.current = Date.now(); } }}>
          <button className="lb-x" aria-label="Schließen">×</button>
          {imgs.length > 1 && <button className="lb-nav l" aria-label="Vorheriges Bild" onClick={(e) => { e.stopPropagation(); setI((x) => (x - 1 + imgs.length) % imgs.length); }}>‹</button>}
          <img src={hiRes(src)} alt={p.name} onClick={(e) => e.stopPropagation()} onError={(e) => { (e.target as HTMLImageElement).src = src; }} />
          {imgs.length > 1 && <button className="lb-nav r" aria-label="Nächstes Bild" onClick={(e) => { e.stopPropagation(); setI((x) => (x + 1) % imgs.length); }}>›</button>}
          {imgs.length > 1 && <div className="lb-count">{i + 1} / {imgs.length}</div>}
        </div>
        , document.body)}
    </div>
  );
}
