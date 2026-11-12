'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { PublicProduct } from '@/lib/types';
import { productPath } from '@/lib/format';
import { webp } from '@/lib/img';
import { Money } from './PriceMode';
import Stars from './Stars';
import { WishButton } from './Wishlist';

/** Bestseller-Leiste: große Bildkacheln randlos nebeneinander, wischbar (Touch, Maus-Ziehen, Trackpad) mit Pfeilen am Desktop */
export default function BestsellerRail({ items, title = 'Bestseller.', sub = 'Diese Artikel sind besonders beliebt.' }: { items: PublicProduct[]; title?: string; sub?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = () => { const el = ref.current; if (!el) return; setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 }); };
  useEffect(() => { update(); const el = ref.current; el?.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); return () => { el?.removeEventListener('scroll', update); window.removeEventListener('resize', update); }; }, []);
  const page = (d: number) => { const el = ref.current; if (!el) return; const w = (el.querySelector('.bs-tile') as HTMLElement | null)?.offsetWidth ?? 300; el.scrollBy({ left: d * Math.max(w, Math.floor(el.clientWidth / w) * w), behavior: 'smooth' }); };

  // Maus-Ziehen am Desktop (Touch scrollt nativ)
  const down = (e: React.PointerEvent) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; const el = ref.current!; drag.current = { x: e.clientX, left: el.scrollLeft, moved: false }; };
  const move = (e: React.PointerEvent) => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 5) { d.moved = true; ref.current!.classList.add('dragging'); } ref.current!.scrollLeft = d.left - dx; };
  const up = () => { const el = ref.current; el?.classList.remove('dragging'); setTimeout(() => { drag.current = null; }, 0); };

  if (!items.length) return null;
  return (
    <section className="bs">
      <div className="bs-head"><h2>{title}</h2><p>{sub}</p></div>
      <div className="bs-wrap">
        <div ref={ref} className="bs-track" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
          onClickCapture={(e) => { if (drag.current?.moved) { e.preventDefault(); e.stopPropagation(); } }}>
          {items.map((p, k) => {
            const img = webp(p.images[0], p.webp), img2 = p.images[1] ? webp(p.images[1], p.webp) : null;
            const min = p.price != null ? (p.tiers.length ? p.tiers[p.tiers.length - 1].price : p.price) : null;
            return (
              <Link key={p.id} href={productPath(p)} className="bs-tile" draggable={false}>
                <span className="bs-img">
                  {img && <img src={img} alt={p.name} loading={k < 4 ? 'eager' : 'lazy'} decoding="async" draggable={false} />}
                  {img2 && <img className="bs-img2" src={img2} alt="" loading="lazy" decoding="async" draggable={false} aria-hidden />}
                  <span className="bs-wish" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}><WishButton id={p.id} /></span>
                  {p.eol?.all && <span className="bs-badge">Auslaufartikel</span>}
                  {p.sale && <span className="bs-badge sale">{p.sale.pct ? `−${p.sale.pct} %` : 'Angebot'}</span>}
                </span>
                <span className="bs-info">
                  <b>{p.name.replace(/\s*\([^)]*\)\s*$/, '')}</b>
                  <span className="bs-sub">{p.brand}{p.colors.length > 1 ? ` · ${p.colors.length} Farben` : ''}</span>
                  {p.rating && p.rating.count > 0 && <span className="bs-rate"><Stars value={p.rating.avg} size={15} /> <span>({p.rating.count.toLocaleString('de-DE')})</span></span>}
                  <span className="bs-price">{p.locked ? 'Preise nach Anmeldung' : p.price != null ? <>{p.was != null && <s><Money net={p.was} /></s>} <Money net={p.price} label />{min! < p.price && <small> · ab {p.tiers[p.tiers.length - 1].min} Stk. <Money net={min!} /></small>}</> : 'Preis auf Anfrage'}</span>
                </span>
              </Link>
            );
          })}
        </div>
        {!edge.start && <button type="button" className="bs-nav l" aria-label="Zurück" onClick={() => page(-1)}>‹</button>}
        {!edge.end && <button type="button" className="bs-nav r" aria-label="Weiter" onClick={() => page(1)}>›</button>}
      </div>
    </section>
  );
}
