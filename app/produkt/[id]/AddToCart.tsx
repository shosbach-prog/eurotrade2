'use client';
import { Fragment, useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { eur } from '@/lib/format';
import ProductImage from '@/components/ProductImage';
import { useCart } from '@/components/CartContext';

export default function AddToCart({ p }: { p: PublicProduct }) {
  const { add } = useCart();
  const [color, setColor] = useState(p.colors[0]);
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(p.sizes.length === 1 ? p.sizes[0] : '');
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const needSize = p.sizes.length > 1 && !size;
  const current = color?.image ?? p.images[img];

  const onAdd = () => {
    add({ id: p.id, sku: p.sku, name: p.name, color: color?.name, hex: color?.hex, size, qty, price: p.price, category: p.category, image: p.images[0] });
    setMsg(`${qty} × ${p.name} (${[color?.name, size].filter(Boolean).join(', ')}) im Warenkorb.`);
  };
  const specs = Object.entries(p.specs ?? {}).filter(([, v]) => v && v !== 'Keine Angabe');

  return (
    <div className="pd">
      <div>
        <div className="gallery"><ProductImage p={p} src={current} hex={color?.hex} /></div>
        {p.images.length > 1 && (
          <div className="thumbs">
            {p.images.map((src, i) => (
              <button key={src} className={i === img ? 'on' : ''} onClick={() => setImg(i)} aria-label={`Bild ${i + 1}`}>
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="muted" style={{ textTransform: 'uppercase', fontSize: 13, letterSpacing: '.4px' }}>{p.brand} · Art.-Nr. {p.sku}</div>
        <h1 style={{ margin: '4px 0 0' }}>{p.name}</h1>
        {p.price != null ? <>
          <div className="price">ab {eur(p.price)}</div>
          <div className="vat">netto zzgl. MwSt. ({eur(p.priceGross)} brutto) · schon ab 1 Stück</div>
        </> : <>
          <div className="price" style={{ fontSize: 22, color: 'var(--brand)' }}>Preis auf Anfrage</div>
          <div className="vat">Schon ab 1 Stück · Ihren Preis erhalten Sie umgehend per E-Mail</div>
        </>}

        {p.colors.length > 0 && <>
          <div className="opt">Farbe: <span className="muted">{color?.name}</span> <span className="muted" style={{ fontWeight: 400 }}>({p.colors.length} Farben)</span></div>
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

        {p.features?.length ? <ul className="feat">{p.features.map((f) => <li key={f}>{f}</li>)}</ul> : <p style={{ marginTop: 20 }}>{p.description}</p>}
        <dl className="specs">
          {p.material && <><dt>Material</dt><dd>{p.material}</dd></>}
          {p.composition && <><dt>Zusammensetzung</dt><dd>{p.composition}</dd></>}
          {p.gender && <><dt>Schnitt</dt><dd>{p.gender}</dd></>}
          {p.sizes.length > 0 && <><dt>Größen</dt><dd>{p.sizes.join(', ')}</dd></>}
          {specs.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
        </dl>
      </div>
    </div>
  );
}
