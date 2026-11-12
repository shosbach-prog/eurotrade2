'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from './CartContext';
import ProductImage from './ProductImage';
import { eur } from '@/lib/format';
import { decoLabel } from '@/lib/deco';
import { unitFor } from '@/lib/tiers';
import { usePrice } from './PriceMode';

/** Seitenleiste: öffnet sich nach „In den Warenkorb“ */
export default function CartDrawer() {
  const { lines, drawer, closeDrawer, remove, lastAdded, count } = useCart();
  const pr = usePrice();
  const path = usePathname();
  useEffect(() => { closeDrawer(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!drawer) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [drawer]); // eslint-disable-line react-hooks/exhaustive-deps

  const perProduct = lines.reduce<Record<string, number>>((m, l) => ({ ...m, [l.id]: (m[l.id] ?? 0) + l.qty }), {});
  const unit = (l: (typeof lines)[number]) => unitFor(l.tiers, perProduct[l.id], l.price);
  const net = lines.reduce((s, l) => s + (unit(l) ?? 0) * l.qty, 0);
  const added = lines.filter((l) => lastAdded.includes(l.key));

  return (
    <div className={`drawer-wrap ${drawer ? 'open' : ''}`} aria-hidden={!drawer}>
      <div className="drawer-bg" onClick={closeDrawer} />
      <aside className="drawer" role="dialog" aria-label="Warenkorb">
        <div className="drawer-head">
          <strong>{added.length ? '✓ Zum Warenkorb hinzugefügt' : 'Warenkorb'}</strong>
          <button className="x" onClick={closeDrawer} aria-label="Schließen">×</button>
        </div>
        <div className="drawer-body">
          {!lines.length && <p className="muted">Ihr Warenkorb ist leer.</p>}
          {lines.map((l) => (
            <div key={l.key} className={`dline ${lastAdded.includes(l.key) ? 'new' : ''}`}>
              <div className="dimg"><ProductImage p={{ name: l.name, images: l.image ? [l.image] : [], colors: [{ name: l.color ?? '', hex: l.hex }], category: l.category }} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="dname">{l.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{[l.color, l.size].filter(Boolean).join(' · ')} · {l.qty} Stk.</div>
                {l.deco && <div className="deco-tag">✦ {decoLabel(l.deco)}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{l.price != null ? pr.pq(unit(l)!, l.qty) : '–'}</div>
                <button className="linkbtn muted" style={{ fontSize: 12 }} onClick={() => remove(l.key)}>entfernen</button>
              </div>
            </div>
          ))}
        </div>
        {lines.length > 0 && (
          <div className="drawer-foot">
            <div className="tot big" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}><span>{count} Stück · {pr.label}</span><span>{eur(lines.reduce((s, l) => s + pr.cq(unit(l) ?? 0, l.qty), 0))}</span></div>
            <a className="btn" href="/warenkorb" style={{ display: 'grid', placeItems: 'center' }}>Zum Warenkorb & Angebot anfordern</a>
            <button className="btn alt" onClick={closeDrawer}>Weiter einkaufen</button>
          </div>
        )}
      </aside>
    </div>
  );
}
