'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PublicProduct } from '@/lib/types';
import { productPath } from '@/lib/format';

const AddToCart = dynamic(() => import('@/app/produkt/[id]/AddToCart'), { ssr: false, loading: () => <div className="qv-load">Wird geladen …</div> });

/** Schnellansicht: Farbe, Größen und Menge direkt aus der Kategorie wählen */
export default function QuickView() {
  const [id, setId] = useState<string | null>(null);
  const [p, setP] = useState<PublicProduct | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    const h = (e: Event) => { setId((e as CustomEvent<string>).detail); };
    window.addEventListener('et-qv', h); return () => window.removeEventListener('et-qv', h);
  }, []);
  useEffect(() => {
    if (!id) return;
    setP(null); setErr(false);
    fetch(`/api/produkte?ids=${encodeURIComponent(id)}`).then((r) => r.json()).then((d: PublicProduct[]) => (d[0] ? setP(d[0]) : setErr(true))).catch(() => setErr(true));
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setId(null); };
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [id]);
  if (!id) return null;
  return (
    <div className="qv-bg" onClick={() => setId(null)}>
      <div className="qv" role="dialog" aria-modal="true" aria-label="Schnellansicht" onClick={(e) => e.stopPropagation()}>
        <div className="qv-head">
          {p && <a className="alink" href={productPath(p)}>Alle Details & Beschreibung →</a>}
          <button type="button" className="qv-x" onClick={() => setId(null)} aria-label="Schließen">×</button>
        </div>
        {err ? <p className="muted" style={{ padding: 30 }}>Artikel konnte nicht geladen werden.</p> : p ? <AddToCart key={p.id} p={p} /> : <div className="qv-load">Wird geladen …</div>}
      </div>
    </div>
  );
}
