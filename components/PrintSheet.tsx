'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PublicProduct } from '@/lib/types';
import { productPath } from '@/lib/format';
import { usePrice } from './PriceMode';

/** Druck-/PDF-Ansicht einer Artikelauswahl (Merkliste) – über den Browser „Als PDF sichern“ */
export function PrintButton({ items, title }: { items: PublicProduct[]; title: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); setOn(false); };
    window.addEventListener('afterprint', done);
    const t = setTimeout(() => window.print(), 300); // Bilder kurz laden lassen
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done); document.body.classList.remove('printing'); };
  }, [on]);
  return (
    <>
      <button type="button" className="btn alt" onClick={() => setOn(true)}>⤓ Als PDF / Drucken</button>
      {on && createPortal(<Sheet items={items} title={title} />, document.body)}
    </>
  );
}

function Sheet({ items, title }: { items: PublicProduct[]; title: string }) {
  const pr = usePrice();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://euro-trade.com';
  const date = new Date().toLocaleDateString('de-DE');
  return (
    <div className="print-sheet">
      <header className="ps-head">
        <div className="ps-logo"><b>euro-<span>trade</span>.com</b><small>Textil · Werbemittel · Veredelung</small></div>
        <div className="ps-meta"><b>{title}</b><span>{items.length} Artikel · Stand {date}</span></div>
      </header>
      <table className="ps-t">
        <thead><tr><th /><th>Artikel</th><th>Farben / Größen</th><th className="r">Preis {pr.label}</th></tr></thead>
        <tbody>{items.map((p) => (
          <tr key={p.id}>
            <td className="ps-img">{p.images[0] && <img src={p.images[0]} alt="" />}</td>
            <td><b>{p.name}</b><div className="ps-s">Art.-Nr. {p.sku} · {p.brand}</div><div className="ps-s ps-l">{origin}{productPath(p)}</div></td>
            <td className="ps-s">{p.colors.length} {p.colors.length === 1 ? 'Farbe' : 'Farben'}: {p.colors.slice(0, 6).map((c) => c.name).join(', ')}{p.colors.length > 6 ? ' …' : ''}<br />{p.sizes.length > 1 ? `Größen ${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}` : p.sizes[0]}</td>
            <td className="r">{p.locked ? <span className="ps-s">nach Anmeldung</span> : p.price != null ? <><b>{pr.p(p.price)}</b>{p.tiers.map((t) => <div key={t.min} className="ps-s">ab {t.min}: {pr.p(t.price)}</div>)}</> : <span className="ps-s">auf Anfrage</span>}</td>
          </tr>
        ))}</tbody>
      </table>
      <footer className="ps-foot">
        <p>Alle Artikel schon ab 1 Stück – auf Wunsch bedruckt oder bestickt mit Ihrem Logo. Preise ohne Veredelung; Staffelpreise gelten je Artikel über alle Farben und Größen. Vor der Produktion erhalten Sie eine Vorschau zur Freigabe.</p>
        <p><b>Euro-Trade</b> · Produktberatung 030 40719258 · {origin.replace(/^https?:\/\//, '')}</p>
      </footer>
    </div>
  );
}
