'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export type HeroItem = { id: string; name: string; brand: string; image: string; colors: string[]; colorCount: number; label: string; href: string };

/** Produktbühne im Hero: wechselt automatisch, pausiert bei Hover, Pfeile + Punkte */
export default function HeroProducts({ items, interval = 4500 }: { items: HeroItem[]; interval?: number }) {
  const [i, setI] = useState(0);
  const [pause, setPause] = useState(false);
  const n = items.length;
  useEffect(() => {
    if (n < 2 || pause || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), interval);
    return () => clearTimeout(t);
  }, [i, n, pause, interval]);
  if (!n) return null;
  const at = (d: number) => items[(i + d + n) % n];
  const p = items[i];
  return (
    <div className="hs" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)} aria-roledescription="Karussell" aria-label="Produkte">
      <div className="hs-stage">
        {n > 2 && <img className="hs-side hs-l" src={at(-1).image} alt="" aria-hidden />}
        {n > 1 && <img className="hs-side hs-r" src={at(1).image} alt="" aria-hidden />}
        <Link href={p.href} className="hs-main" aria-live="polite">
          {items.map((x, k) => <img key={x.id} src={x.image} alt={k === i ? x.name : ''} className={k === i ? 'on' : ''} loading={k < 2 ? 'eager' : 'lazy'} />)}
          <span className="hs-badge">{i + 1} / {n}</span>
        </Link>
        {n > 1 && <>
          <button type="button" className="hs-arr hs-prev" onClick={() => setI((i - 1 + n) % n)} aria-label="Vorheriger Artikel">‹</button>
          <button type="button" className="hs-arr hs-next" onClick={() => setI((i + 1) % n)} aria-label="Nächster Artikel">›</button>
        </>}
      </div>
      <Link href={p.href} className="hs-info">
        <div>
          <span className="hs-brand">{p.brand}</span>
          <b className="hs-name">{p.name}</b>
          <span className="hs-sw">{p.colors.map((c) => <i key={c} style={{ background: c }} />)}{p.colorCount > p.colors.length && <em>+{p.colorCount - p.colors.length}</em>}</span>
        </div>
        <span className="hs-price">{p.label}<span>Ansehen →</span></span>
      </Link>
      {n > 1 && <div className="hs-dots">{items.map((x, k) => <button key={x.id} type="button" className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Artikel ${k + 1}`} />)}</div>}
    </div>
  );
}
