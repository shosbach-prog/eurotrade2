import Link from 'next/link';
import { notFound } from 'next/navigation';
import FilterGrid from '@/components/FilterGrid';
import { ReviewStrip } from '@/components/ProductReviews';
import Stars from '@/components/Stars';
import { getByCategory, getCategories } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';
import { categoryContent } from '@/lib/category-content';
import { latestReviews } from '@/lib/reviews';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const c = getCategories(await getCustomer()).find((x) => x.slug === params.slug);
  return { title: c?.name ?? 'Kategorie', description: c ? categoryContent(c.slug, c.name).intro : undefined };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const ctx = await getCustomer();
  const cat = getCategories(ctx).find((x) => x.slug === params.slug);
  if (!cat) notFound();
  const items = getByCategory(params.slug, ctx);
  const txt = categoryContent(cat.slug, cat.name);
  const rated = items.filter((p) => p.rating);
  const catRating = rated.length ? { avg: rated.reduce((s, p) => s + p.rating!.avg * p.rating!.count, 0) / rated.reduce((s, p) => s + p.rating!.count, 0), count: rated.reduce((s, p) => s + p.rating!.count, 0) } : null;
  const heroImgs = items.flatMap((p) => p.images.slice(0, 1)).slice(0, 3);
  return (
    <>
      <div className="crumbs"><Link href="/">Start</Link> › {cat.name}</div>
      <section className="cat-hero">
        <div className="cat-hero-text">
          <h1>{cat.name}</h1>
          {catRating && <div className="cat-rating"><Stars value={catRating.avg} size={16} showValue count={catRating.count} /></div>}
          <p>{txt.intro}</p>
        </div>
        <div className="cat-hero-imgs">{heroImgs.map((src) => <img key={src} src={src} alt="" loading="lazy" />)}</div>
      </section>
      <ul className="usp">
        <li><b>Ab 1 Stück</b> · Staffelpreise ab 10</li>
        <li><b>Druck & Stick</b> aus einer Hand</li>
        <li><b>Vorschau</b> vor jeder Produktion</li>
        <li><b>Angebot in 24 h</b></li>
      </ul>
      <FilterGrid items={items} />
      <ReviewStrip reviews={latestReviews(6, items.map((p) => p.id))} overall={catRating} title={`Bewertungen zu ${cat.name}`} />
      <section className="cat-seo">
        <div><h2>{cat.name} mit Ihrem Logo</h2>{txt.seo.map((x) => <p key={x}>{x}</p>)}<p><Link className="alink" href="/druck-stick">Druck & Stick im Vergleich →</Link></p></div>
        <div className="faq"><h2>Häufige Fragen</h2>{txt.faq.map(([q, a]) => <details key={q} className="box"><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>
    </>
  );
}
