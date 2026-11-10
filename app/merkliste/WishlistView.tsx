'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/components/Wishlist';
import type { PublicProduct } from '@/lib/types';

export default function WishlistView() {
  const { ids, clear } = useWishlist();
  const [items, setItems] = useState<PublicProduct[] | null>(null);
  const key = ids.join(',');

  useEffect(() => {
    if (!key) { setItems([]); return; }
    fetch(`/api/produkte?ids=${encodeURIComponent(key)}`).then((r) => r.json()).then(setItems).catch(() => setItems([]));
  }, [key]);

  // Entfernte Artikel sofort ausblenden, ohne neu zu laden
  const shown = (items ?? []).filter((p) => ids.includes(p.id));

  if (items === null) return <h1>Merkliste</h1>;
  if (!shown.length) return (
    <div className="box" style={{ maxWidth: 640, margin: '20px auto', textAlign: 'center' }}>
      <h1>Ihre Merkliste ist leer</h1>
      <p className="muted">Tippen Sie bei einem Artikel auf das Herz, um ihn hier zu sammeln – praktisch zum Vergleichen und für spätere Anfragen.</p>
      <Link className="btn" href="/" style={{ display: 'inline-grid', placeItems: 'center' }}>Artikel entdecken</Link>
    </div>
  );
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h1>Merkliste <span className="muted" style={{ fontWeight: 400, fontSize: 18 }}>({shown.length})</span></h1>
        <button type="button" className="linkbtn" onClick={() => { if (confirm('Merkliste wirklich leeren?')) clear(); }}>Liste leeren</button>
      </div>
      <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </>
  );
}
