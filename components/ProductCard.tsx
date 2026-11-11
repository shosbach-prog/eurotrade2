import Link from 'next/link';
import { webp } from '@/lib/img';
import type { PublicProduct } from '@/lib/types';
import { eur } from '@/lib/format';
import ProductImage from './ProductImage';
import { swatchBg } from '@/lib/colors';
import { WishButton } from './Wishlist';
import Stars from './Stars';
import BrandLogo from './BrandLogo';
import { productPath } from '@/lib/format';

/** echte Merkmale als Badges – keine erfundenen Labels */
function badges(p: PublicProduct): { t: string; c: string }[] {
  const b: { t: string; c: string }[] = [];
  if (p.rating && p.rating.count >= 3 && p.rating.avg >= 4.5) b.push({ t: 'Top bewertet', c: 'b-top' });
  if (p.price != null && p.tiers.length) b.push({ t: `bis −${Math.round((1 - p.tiers[p.tiers.length - 1].price / p.price) * 100)} % Staffel`, c: 'b-deal' });
  // nur belegte Material-Labels (keine pauschalen Umweltaussagen)
  const cert = p.specs?.['Zertifizierung'] ?? '';
  const pending = (p.features ?? []).some((x) => /in arbeit/i.test(x));
  if (/recycel/i.test(cert)) b.push({ t: 'Recycelt', c: 'b-eco' });
  else if (/bio/i.test(cert) && !pending) b.push({ t: 'Bio-Baumwolle', c: 'b-eco' });
  return b.slice(0, 2);
}
const sizeRange = (s: string[]) => (s.length > 1 ? `${s[0]}–${s[s.length - 1]}` : s[0] ?? '');

export default function ProductCard({ p }: { p: PublicProduct }) {
  const min = p.price != null ? (p.tiers.length ? p.tiers[p.tiers.length - 1].price : p.price) : null;
  return (
    <Link href={productPath(p)} className="card">
      <div className="img">
        <ProductImage p={p} />{p.images[1] && <img className="pimg img2" src={webp(p.images[1], p.webp)} alt="" loading="lazy" aria-hidden />}
        <div className="badges">{badges(p).map((x) => <span key={x.t} className={`badge-p ${x.c}`}>{x.t}</span>)}</div>
        <WishButton id={p.id} />
      </div>
      <div className="b">
        {p.rating ? <div className="card-rating"><Stars value={p.rating.avg} size={13} count={p.rating.count} /></div> : null}
        <div className="name">{p.name}</div>
        <div className="brand"><BrandLogo name={p.brand} h={16} />{p.sizes.length > 0 && <span>{sizeRange(p.sizes)}</span>}</div>
        <div className="dots">
          {p.colors.slice(0, 7).map((c) => <span key={c.name} className="dot" title={c.name} style={{ background: swatchBg(c) }} />)}
          {p.colors.length > 7 && <span className="dots-more">+{p.colors.length - 7}</span>}
        </div>
        <div className="price">{p.locked ? <small className="lock-p">🔒 Preise nach Anmeldung</small> : min != null ? <><span className="ab">ab</span> {eur(min)} <small>netto</small></> : <small style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>Preis auf Anfrage</small>}</div>
      </div>
    </Link>
  );
}
