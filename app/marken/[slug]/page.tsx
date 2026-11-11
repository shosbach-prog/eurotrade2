import Link from 'next/link';
import { notFound } from 'next/navigation';
import FilterGrid from '@/components/FilterGrid';
import { slimCard } from '@/lib/catalog';
import JsonLd, { crumbSchema } from '@/components/JsonLd';
import { viewCtx } from '@/lib/customer';
import { brandBySlug, productsOfBrand } from '@/lib/brand-catalog';
import { brandTeaser, brandText } from '@/lib/brand-texts';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const b = brandBySlug(params.slug, await viewCtx());
  return b ? { title: `${b.name} bedrucken & besticken`, description: (brandTeaser(b.name) ?? `${b.name} Textilien mit Ihrem Logo – bedruckt oder bestickt ab 1 Stück bei Euro-Trade.`).slice(0, 158), alternates: { canonical: `/marken/${b.slug}` } } : {};
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const ctx = await viewCtx();
  const b = brandBySlug(params.slug, ctx);
  if (!b) notFound();
  const items = productsOfBrand(b, ctx);
  const txt = brandText(b.name);
  return (
    <>
      <JsonLd data={crumbSchema([['Start', '/'], ['Marken', '/marken'], [b.name, `/marken/${b.slug}`]])} />
      <div className="crumbs"><Link href="/">Start</Link> › <Link href="/marken">Marken</Link> › {b.name}</div>
      <section className="brand-hero">
        {b.logo ? <img src={`/brands/${b.logo}`} alt={b.name} /> : null}
        <div>
          <h1>{b.name}</h1>
          {brandText(b.name) && <div className="brand-tags"><span>Ideal für</span>{brandText(b.name)!.f.map((x) => <b key={x}>{x}</b>)}</div>}
          <p className="muted" style={{ margin: '8px 0 0' }}>{items.length ? `${items.length} Artikel – schon ab 1 Stück, auf Wunsch mit Ihrem Logo bedruckt oder bestickt.` : 'Artikel dieser Marke besorgen wir Ihnen gern auf Anfrage.'}</p>
        </div>
      </section>
      {txt && <section className="brand-about">
        <div className="brand-copy"><h2>Über {b.name}</h2>{txt.t.split('\n\n').map((x, k) => <p key={k}>{x}</p>)}</div>
        {Object.values(txt.x).some(Boolean) && <aside className="brand-facts"><h3>Steckbrief</h3><dl>
          {txt.x.gegruendet && <><dt>Gegründet</dt><dd>{txt.x.gegruendet}</dd></>}
          {txt.x.sitz && <><dt>Sitz</dt><dd>{txt.x.sitz}</dd></>}
          {txt.x.mitarbeiter && <><dt>Mitarbeiter</dt><dd>{txt.x.mitarbeiter}</dd></>}
          {txt.x.gehoert && <><dt>Gehört zu</dt><dd>{txt.x.gehoert}</dd></>}
        </dl><small>Angaben laut Unternehmen bzw. Fachpresse</small></aside>}
      </section>}
      {items.length ? <FilterGrid items={items.map(slimCard)} /> : <p><Link className="btn" href={`/kontakt?marke=${encodeURIComponent(b.name)}`}>Artikel anfragen</Link></p>}
    </>
  );
}
