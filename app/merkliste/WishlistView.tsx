'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/components/Wishlist';
import type { PublicProduct } from '@/lib/types';
import { PrintButton } from '@/components/PrintSheet';

export default function WishlistView({ shared }: { shared: string[] | null }) {
  const { ids, clear, addAll } = useWishlist();
  const [items, setItems] = useState<PublicProduct[] | null>(null);
  const [copied, setCopied] = useState(false);
  const list = shared ?? ids;
  const key = list.join(',');

  useEffect(() => {
    if (!key) { setItems([]); return; }
    fetch(`/api/produkte?ids=${encodeURIComponent(key)}`).then((r) => r.json()).then(setItems).catch(() => setItems([]));
  }, [key]);

  // Eigene Liste: entfernte Artikel sofort ausblenden
  const shown = (items ?? []).filter((p) => shared || ids.includes(p.id));

  async function share() {
    const url = `${window.location.origin}/merkliste?liste=${ids.join(',')}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Meine Auswahl', url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    } catch { /* abgebrochen */ }
  }

  if (items === null) return <h1>{shared ? 'Geteilte Auswahl' : 'Merkliste'}</h1>;

  if (shared) {
    const missing = shared.filter((x) => !ids.includes(x));
    return (
      <>
        <div className="list-head">
          <div>
            <h1 style={{ marginBottom: 4 }}>Geteilte Auswahl <span className="muted" style={{ fontWeight: 400, fontSize: 18 }}>({shown.length})</span></h1>
            <p className="muted" style={{ margin: 0 }}>Diese Artikel wurden für Sie zusammengestellt.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><PrintButton items={shown} title="Artikelauswahl" />{missing.length > 0
            ? <button className="btn" onClick={() => addAll(missing)}>Alle auf meine Merkliste</button>
            : <Link className="btn alt" href="/merkliste" style={{ display: 'inline-grid', placeItems: 'center' }}>Zu meiner Merkliste</Link>}</div>
        </div>
        {shown.length ? <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <p className="muted">Die Artikel dieser Auswahl sind nicht mehr verfügbar.</p>}
      </>
    );
  }

  if (!shown.length) return (
    <div className="box" style={{ maxWidth: 640, margin: '20px auto', textAlign: 'center' }}>
      <h1>Ihre Merkliste ist leer</h1>
      <p className="muted">Tippen Sie bei einem Artikel auf das Herz, um ihn hier zu sammeln – praktisch zum Vergleichen, für spätere Anfragen oder um eine Auswahl mit Ihrem Team zu teilen.</p>
      <Link className="btn" href="/" style={{ display: 'inline-grid', placeItems: 'center' }}>Artikel entdecken</Link>
    </div>
  );
  return (
    <>
      <div className="list-head">
        <h1>Merkliste <span className="muted" style={{ fontWeight: 400, fontSize: 18 }}>({shown.length})</span></h1>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn" onClick={share}>{copied ? '✓ Link kopiert' : 'Auswahl teilen'}</button>
          <PrintButton items={shown} title="Ihre Artikelauswahl" />
          <button type="button" className="linkbtn" onClick={() => { if (confirm('Merkliste wirklich leeren?')) clear(); }}>Liste leeren</button>
        </div>
      </div>
      <p className="muted" style={{ marginTop: -6 }}>Teilen Sie den Link z. B. mit Ihrem Team oder Ihren Vereinsmitgliedern – jeder kann daraus direkt bestellen.</p>
      <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </>
  );
}
