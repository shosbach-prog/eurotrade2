import Link from 'next/link';
import type { PublicProduct } from '@/lib/types';
import { eur } from '@/lib/format';
import ProductImage from './ProductImage';
import { swatchBg } from '@/lib/colors';
import { WishButton } from './Wishlist';

export default function ProductCard({ p }: { p: PublicProduct }) {
  return (
    <Link href={`/produkt/${encodeURIComponent(p.id)}`} className="card">
      <div className="img"><ProductImage p={p} />{p.images[1] && <img className="pimg img2" src={p.images[1]} alt="" loading="lazy" aria-hidden />}<WishButton id={p.id} /></div>
      <div className="b">
        <div className="brand">{p.brand}</div>
        <div className="name">{p.name}</div>
        <div className="dots">
          {p.colors.slice(0, 8).map((c) => <span key={c.name} className="dot" title={c.name} style={{ background: swatchBg(c) }} />)}
          {p.colors.length > 8 && <span className="muted" style={{ fontSize: 12 }}>+{p.colors.length - 8}</span>}
        </div>
        <div className="price">{p.price != null ? <>ab {eur(p.price)} <small>netto</small></> : <small style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>Preis auf Anfrage</small>}</div>
      </div>
    </Link>
  );
}
