import Link from 'next/link';
import { notFound } from 'next/navigation';
import FilterGrid from '@/components/FilterGrid';
import { ReviewStrip } from '@/components/ProductReviews';
import Stars from '@/components/Stars';
import JsonLd, { crumbSchema, faqSchema } from '@/components/JsonLd';
import { dealProducts, getByCategory, getCategories, slimCard } from '@/lib/catalog';
import { viewCtx } from '@/lib/customer';
import { categoryContent } from '@/lib/category-content';
import { latestReviews } from '@/lib/reviews';
import { refsFor } from '@/lib/store';
import RefStrip from '@/components/RefStrip';
import { SUBTYPES, matchSub, subOf } from '@/lib/menu-defs';

type SP = { typ?: string; g?: string };
const GEN = ['Damen', 'Herren', 'Kinder'];

export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (params.slug === 'sonderangebote') return { title: 'Sonderangebote & Auslaufartikel – Markentextilien mit Logo', description: 'Auslaufartikel und Restposten bekannter Marken – solange Vorrat, bedruckt oder bestickt mit Ihrem Logo ab 1 Stück.', alternates: { canonical: '/kategorie/sonderangebote' } };
  const c = getCategories(await viewCtx()).find((x) => x.slug === params.slug);
  return { title: c ? `${c.name} mit Logo bedrucken & besticken` : 'Kategorie', description: c ? categoryContent(c.slug, c.name).intro : undefined, alternates: c ? { canonical: `/kategorie/${c.slug}` } : undefined };
}

export default async function CategoryPage({ params, searchParams = {} }: { params: { slug: string }; searchParams?: SP }) {
  const ctx = await viewCtx();
  if (params.slug === 'sonderangebote') {
    const deals = dealProducts(ctx);
    return (
      <>
        <JsonLd data={crumbSchema([['Start', '/'], ['Sonderangebote', '/kategorie/sonderangebote']])} />
        <div className="crumbs"><Link href="/">Start</Link> › Sonderangebote</div>
        <section className="cat-hero deal-hero">
          <div className="cat-hero-text">
            <h1>Sonderangebote & Auslaufartikel</h1>
            <p>Markentextilien, die beim Hersteller auslaufen – lieferbar solange Vorrat. Ideal für Aktionen, Events und Teams, die jetzt bestellen. Auch hier: bedruckt oder bestickt mit Ihrem Logo ab 1 Stück.</p>
          </div>
        </section>
        {deals.length ? <FilterGrid items={deals.map(slimCard)} /> : <div className="box muted">Aktuell keine Sonderangebote – schauen Sie bald wieder vorbei.</div>}
        <p className="muted" style={{ fontSize: 13 }}>„Läuft aus“ heißt: Der Hersteller produziert den Artikel bzw. die Farbe nicht mehr nach. Bei größeren Mengen prüfen wir die Verfügbarkeit vor dem Angebot.</p>
      </>
    );
  }
  const cat = getCategories(ctx).find((x) => x.slug === params.slug);
  if (!cat) notFound();
  const all = getByCategory(params.slug, ctx);
  const sub = subOf(cat.slug, searchParams.typ);
  const items = sub ? all.filter((p) => matchSub(sub, p.name)) : all;
  const g = GEN.includes(searchParams.g ?? '') ? searchParams.g! : null;
  const subs = (SUBTYPES[cat.slug] ?? []).map((s) => ({ ...s, n: all.filter((p) => matchSub(s, p.name)).length })).filter((s) => s.n >= 2 && s.n < all.length);
  const txt = categoryContent(cat.slug, cat.name);
  const rated = items.filter((p) => p.rating);
  const catRating = rated.length ? { avg: rated.reduce((s, p) => s + p.rating!.avg * p.rating!.count, 0) / rated.reduce((s, p) => s + p.rating!.count, 0), count: rated.reduce((s, p) => s + p.rating!.count, 0) } : null;
  const heroImgs = items.flatMap((p) => p.images.slice(0, 1)).slice(0, 3);
  return (
    <>
      <JsonLd data={crumbSchema([['Start', '/'], [cat.name, `/kategorie/${cat.slug}`]])} />
      <JsonLd data={faqSchema(txt.faq)} />
      <div className="crumbs"><Link href="/">Start</Link> › {sub ? <><Link href={`/kategorie/${cat.slug}`}>{cat.name}</Link> › {sub.label}</> : cat.name}</div>
      <section className="cat-hero">
        <div className="cat-hero-text">
          <h1>{sub ? sub.label : cat.name}{g && <small className="h1-g"> · {g}</small>}</h1>
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
      {subs.length > 0 && <nav className="subchips" aria-label="Artikeltyp">
        <Link href={`/kategorie/${cat.slug}${g ? `?g=${g}` : ''}`} className={!sub ? 'on' : ''}>Alle {cat.name} <span>{all.length}</span></Link>
        {subs.map((s) => <Link key={s.key} href={`/kategorie/${cat.slug}?typ=${s.key}${g ? `&g=${g}` : ''}`} className={sub?.key === s.key ? 'on' : ''}>{s.label} <span>{s.n}</span></Link>)}
      </nav>}
      <FilterGrid key={`${sub?.key ?? ''}|${g ?? ''}`} items={items.map(slimCard)} initialGenders={g ? (g === 'Kinder' ? [g] : [g, 'Unisex']) : undefined} />
      <RefStrip refs={refsFor({ category: cat.name, categorySlug: cat.slug })} title={`${cat.name} mit Logo – Beispiele unserer Kunden`} />
      <ReviewStrip reviews={latestReviews(6, items.map((p) => p.id))} overall={catRating} title={`Bewertungen zu ${cat.name}`} />
      <section className="cat-seo">
        <div><h2>{cat.name} mit Ihrem Logo</h2>{txt.seo.map((x) => <p key={x}>{x}</p>)}<p><Link className="alink" href="/druck-stick">Druck & Stick im Vergleich →</Link></p></div>
        <div className="faq"><h2>Häufige Fragen</h2>{txt.faq.map(([q, a]) => <details key={q} className="box"><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>
    </>
  );
}
