'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { myInquiries } from '@/lib/mine';
import { eur } from '@/lib/format';
import { useCart } from '@/components/CartContext';
import type { PublicProduct } from '@/lib/types';
import type { Deco } from '@/lib/deco';

type L = { id?: string; name: string; color: string; size: string; qty: number; deco: Deco | null };
type Row = { no: string; date: string; status: string; statusLabel: string; pieces: number; total: number; offer: { gross: number; url: string } | null; url: string | null; lines: L[] };

export default function MyInquiries() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState('');
  const { addMany, openDrawer } = useCart();

  useEffect(() => {
    const mine = myInquiries();
    fetch('/api/meine-anfragen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokens: mine.map((m) => m.token) }) })
      .then((r) => r.json()).then(setRows).catch(() => setRows([]));
  }, []);

  async function reorder(r: Row) {
    const ids = [...new Set(r.lines.map((l) => l.id).filter(Boolean))] as string[];
    const prods: PublicProduct[] = await fetch(`/api/produkte?ids=${encodeURIComponent(ids.join(','))}`).then((x) => x.json()).catch(() => []);
    const items = r.lines.flatMap((l) => {
      const p = prods.find((x) => x.id === l.id);
      if (!p) return [];
      const col = p.colors.find((c) => c.name === l.color);
      return [{ id: p.id, sku: p.sku, name: p.name, color: l.color || undefined, hex: col?.hex, size: l.size || undefined, qty: l.qty, price: p.price, category: p.category, image: p.images[0], deco: l.deco, tiers: p.tiers, sizes: p.sizes }];
    });
    if (!items.length) { setMsg('Die Artikel dieser Anfrage sind nicht mehr verfügbar.'); return; }
    addMany(items);
    openDrawer();
    setMsg(items.length < r.lines.length ? 'Einige Artikel sind nicht mehr verfügbar und wurden übersprungen.' : `✓ ${items.reduce((s, x) => s + x.qty, 0)} Stück aus Anfrage ${r.no} im Warenkorb – gleiche Farben, Größen und Veredelung. Mengen können Sie im Warenkorb anpassen.`);
  }

  if (rows === null) return <h1>Meine Anfragen</h1>;
  return (
    <>
      <h1>Meine Anfragen</h1>
      <p className="muted" style={{ marginTop: -8 }}>Ihre Anfragen und Bestellungen – mit Status, Angebot und Nachbestellung per Klick (gleiche Artikel, Farben, Größen und Logo).</p>
      {msg && <div className="note">{msg}</div>}
      {!rows.length ? (
        <div className="box" style={{ textAlign: 'center' }}>
          <p>Hier erscheinen Ihre Anfragen, sobald Sie eine gesendet haben.</p>
          <Link className="btn" href="/" style={{ display: 'inline-grid', placeItems: 'center' }}>Artikel entdecken</Link>
        </div>
      ) : (
        <div className="my-list">
          {rows.map((r) => (
            <div key={r.no} className="box my-row">
              <div className="my-top">
                <div><b>Anfrage {r.no}</b> <span className="muted">· {new Date(r.date).toLocaleDateString('de-DE')} · {r.pieces} Stück</span></div>
                <span className={`st st-${r.status}`}>{r.statusLabel}</span>
              </div>
              <div className="my-lines">{r.lines.slice(0, 6).map((l, k) => <span key={k}>{l.qty}× {l.name}{l.color && ` · ${l.color}`}{l.size && ` · ${l.size}`}{l.deco && ' ✦'}</span>)}{r.lines.length > 6 && <span>… und {r.lines.length - 6} weitere</span>}</div>
              <div className="my-actions">
                {r.offer ? <a className="btn" href={r.offer.url} style={{ display: 'inline-grid', placeItems: 'center' }}>Angebot ansehen · {eur(r.offer.gross)}</a>
                  : r.url ? <a className="btn alt" href={r.url} style={{ display: 'inline-grid', placeItems: 'center' }}>Status ansehen</a> : <span className="muted" style={{ fontSize: 14 }}>Ihr Angebot ist in Arbeit.</span>}
                <button className="btn alt" onClick={() => reorder(r)}>↻ Nachbestellen</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
