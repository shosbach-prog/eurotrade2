import Link from 'next/link';
import type { BrandInfo } from '@/lib/brand-catalog';

/** Logo-Leiste der Marken im Shop */
export default function BrandStrip({ brands, link = true }: { brands: BrandInfo[]; link?: boolean }) {
  const shown = brands.filter((b) => b.logo).sort((a, b) => b.count - a.count);
  if (!shown.length) return null;
  return (
    <section className="brand-strip">
      <div className="bs-head"><h2>Unsere Marken</h2><Link href="/marken" className="alink">Alle Marken →</Link></div>
      <div className="bs-row">
        {shown.slice(0, 18).map((b) => link && b.count
          ? <Link key={b.slug} href={`/marken/${b.slug}`} title={b.name}><img src={`/brands/${b.logo}`} alt={b.name} loading="lazy" /></Link>
          : <span key={b.slug} title={b.name}><img src={`/brands/${b.logo}`} alt={b.name} loading="lazy" /></span>)}
      </div>
    </section>
  );
}
