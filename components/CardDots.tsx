'use client';
import { useEffect, useRef, useState } from 'react';

type D = { name: string; bg: string; img?: string };
/** Farbpunkte auf der Kachel: Hover (Desktop) bzw. Tippen (Mobil) zeigt das Foto der Farbe – sofern es eins gibt */
export default function CardDots({ colors, more }: { colors: D[]; more: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState<string | null>(null);
  const imgOf = () => ref.current?.closest('.card')?.querySelector<HTMLImageElement>('.img .pimg:not(.img2)') ?? null;
  const show = (d: D) => {
    const im = imgOf(); if (!im || !d.img) return;
    if (!im.dataset.orig) im.dataset.orig = im.currentSrc || im.src;
    im.src = d.img; im.loading = 'eager';
    ref.current?.closest('.card')?.classList.add('cswap'); setOn(d.name);
  };
  // beim Verlassen der Kachel wieder das Standardfoto
  useEffect(() => {
    const card = ref.current?.closest('.card'); if (!card) return;
    const reset = () => { const im = imgOf(); if (im?.dataset.orig) { im.src = im.dataset.orig; delete im.dataset.orig; } card.classList.remove('cswap'); setOn(null); };
    card.addEventListener('mouseleave', reset); return () => card.removeEventListener('mouseleave', reset);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Bilder der Farben beim ersten Hover vorladen
  const preload = () => colors.forEach((d) => { if (d.img) { const i = new Image(); i.src = d.img; } });
  return (
    <div ref={ref} className="dots" onMouseEnter={preload}>
      {colors.map((d) => d.img
        ? <button key={d.name} type="button" className="dot-hit" title={d.name} aria-label={`Farbe ${d.name} ansehen`}
            onMouseEnter={() => show(d)} onFocus={() => show(d)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); show(d); }}><span className={`dot has ${on === d.name ? 'on' : ''}`} style={{ background: d.bg }} /></button>
        : <span key={d.name} className="dot" title={d.name} style={{ background: d.bg }} />)}
      {more > 0 && <span className="dots-more">+{more}</span>}
    </div>
  );
}

/** Schnellansicht-Knopf auf der Kachel (öffnet das Overlay aus QuickView) */
export function QuickBtn({ id }: { id: string }) {
  return <button type="button" className="qv-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.dispatchEvent(new CustomEvent('et-qv', { detail: id })); }}>Schnellansicht</button>;
}
