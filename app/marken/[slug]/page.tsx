import Link from 'next/link';
import { notFound } from 'next/navigation';
import FilterGrid from '@/components/FilterGrid';
import JsonLd, { crumbSchema } from '@/components/JsonLd';
import { viewCtx } from '@/lib/customer';
import { brandBySlug, productsOfBrand } from '@/lib/brand-catalog';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const b = brandBySlug(params.slug, await viewCtx());
  return b ? { title: `${b.name} bedrucken & besticken`, description: `${b.name} Textilien mit Ihrem Logo – bedruckt oder bestickt ab 1 Stück bei Euro-Trade.`, alternates: { canonical: `/marken/${b.slug}` } } : {};
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const ctx = await viewCtx();
  const b = brandBySlug(params.slug, ctx);
  if (!b) notFound();
  const items = productsOfBrand(b, ctx);
  return (
    <>
      <JsonLd data={crumbSchema([['Start', '/'], ['Marken', '/marken'], [b.name, `/marken/${b.slug}`]])} />
      <div className="crumbs"><Link href="/">Start</Link> › <Link href="/marken">Marken</Link> › {b.name}</div>
      <section className="brand-hero">
        {b.logo ? <img src={`/brands/${b.logo}`} alt={b.name} /> : null}
        <div>
          <h1>{b.name}</h1>
          <p className="muted">{items.length ? `${items.length} Artikel – schon ab 1 Stück, auf Wunsch mit Ihrem Logo bedruckt oder bestickt.` : 'Artikel dieser Marke besorgen wir Ihnen gern auf Anfrage.'}</p>
        </div>
      </section>
      {items.length ? <FilterGrid items={items} /> : <p><Link className="btn" href={`/kontakt?marke=${encodeURIComponent(b.name)}`}>Artikel anfragen</Link></p>}
    </>
  );
}
