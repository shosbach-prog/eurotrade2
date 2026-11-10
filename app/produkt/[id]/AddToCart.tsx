'use client';
import { useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { eur } from '@/lib/format';
import ProductImage from '@/components/ProductImage';
import { useCart } from '@/components/CartContext';

export default function AddToCart({ p }: { p: PublicProduct }) {
  const { add } = useCart();
  const [color, setColor] = useState(p.colors[0]);
  const [size, setSize] = useState(p.sizes.length === 1 ? p.sizes[0] : '');
  const [qty, setQty] = useState(10);
  const [msg, setMsg] = useState('');
  const needSize = p.sizes.length > 1 && !size;

  const onAdd = () => {
    add({ id: p.id, sku: p.sku, name: p.name, color: color?.name, hex: color?.hex, size, qty, price: p.price, category: p.category, image: color?.image ?? p.images[0] });
    setMsg(`${qty} × ${p.name} (${[color?.name, size].filter(Boolean).join(', ')}) im Warenkorb.`);
  };

  return (
    <div className="pd">
      <div className="gallery"><ProductImage p={p} src={color?.image} hex={color?.hex} /></div>
      <div>
        <div className="muted" style={{ textTransform: 'uppercase', fontSize: 13, letterSpacing: '.4px' }}>{p.brand} · Art.-Nr. {p.sku}</div>
        <h1 style={{ margin: '4px 0 0' }}>{p.name}</h1>
        <div className="price">ab {eur(p.price)}</div>
        <div className="vat">netto zzgl. MwSt. ({eur(p.priceGross)} brutto) · Staffelpreise im Angebot</div>

        {p.colors.length > 0 && <>
          <div className="opt">Farbe: <span className="muted">{color?.name}</span></div>
          <div className="swatches">
            {p.colors.map((c) => <button key={c.name} title={c.name} aria-label={c.name} className={`sw ${c.name === color?.name ? 'on' : ''}`} style={{ background: c.hex ?? '#ddd' }} onClick={() => setColor(c)} />)}
          </div>
        </>}

        {p.sizes.length > 1 && <>
          <div className="opt">Größe</div>
          <div className="sizes">{p.sizes.map((s) => <button key={s} className={`size ${s === size ? 'on' : ''}`} onClick={() => setSize(s)}>{s}</button>)}</div>
        </>}

        <div className="qtyrow">
          <input className="qty" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} aria-label="Menge" />
          <button className="btn" disabled={needSize} onClick={onAdd}>{needSize ? 'Bitte Größe wählen' : 'In den Warenkorb'}</button>
        </div>
        {msg && <div className="note ok">✓ {msg} <a href="/warenkorb" style={{ textDecoration: 'underline' }}>Zum Warenkorb</a></div>}

        <p style={{ marginTop: 20 }}>{p.description}</p>
        <dl className="specs">
          {p.material && <><dt>Material</dt><dd>{p.material}</dd></>}
          {p.gender && <><dt>Schnitt</dt><dd>{p.gender}</dd></>}
          {p.sizes.length > 0 && <><dt>Größen</dt><dd>{p.sizes.join(', ')}</dd></>}
          {p.stock != null && <><dt>Verfügbarkeit</dt><dd>{p.stock > 0 ? 'Auf Lager' : 'Auf Anfrage'}</dd></>}
        </dl>
      </div>
    </div>
  );
}
