import BestsellerRail from '@/components/BestsellerRail';
import { bestsellersIn } from '@/lib/bestseller';
import { catPath } from '@/lib/format';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import FilterGrid from '@/components/FilterGrid';
import { ReviewStrip } from '@/components/ProductReviews';
import Stars from '@/components/Stars';
import JsonLd, { crumbSchema, faqSchema } from '@/components/JsonLd';
import { eolCount, eolProducts, getByCategory, getCategories, saleCount, saleProducts, slimCard } from '@/lib/catalog';
import { viewCtx } from '@/lib/customer';
import { categoryContent } from '@/lib/category-content';
import { latestReviews } from '@/lib/reviews';
import { refsFor } from '@/lib/store';
import RefStrip from '@/components/RefStrip';
import { SUBTYPES, matchSub, subBySlug, subOf } from '@/lib/menu-defs';

type SP = { typ?: string; g?: string };
const GEN = ['Damen', 'Herren', 'Kinder'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** /kategorie/t-shirts-herren → Basis „t-shirts“ + Zielgruppe „Herren“ (auch für Unterkategorien) */
function parseSlug(slug: string, cats: { slug: string }[]) {
  const m = slug.match(/^(.+)-(damen|herren|kinder)$/);
  if (m && (subBySlug(m[1]) || cats.some((c) => c.slug === m[1]))) return { base: m[1], g: cap(m[2]) };
  return { base: slug, g: null as string | null };
}
const catUrl = (base: string, g?: string | null) => catPath(`${base}${g ? `-${g.toLowerCase()}` : ''}`);
const forG = (g: string | null) => (p: { gender?: string }) => !g || p.gender === g || (g !== 'Kinder' && (p.gender ?? 'Unisex') === 'Unisex');
const gLabel = (g: string) => (g === 'Kinder' ? 'für Kinder' : `für ${g}`);

export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (params.slug === 'sonderangebote') return { title: 'Sonderangebote – Markentextilien mit Logo zum Aktionspreis', description: 'Aktuelle Sonderangebote: ausgewählte Markentextilien zum reduzierten Preis – bedruckt oder bestickt mit Ihrem Logo ab 1 Stück.', alternates: { canonical: catPath('sonderangebote') } };
  if (params.slug === 'auslaufartikel') return { title: 'Auslaufartikel & Restposten – Markentextilien solange Vorrat', description: 'Auslaufartikel und Restposten bekannter Marken – solange Vorrat, bedruckt oder bestickt mit Ihrem Logo ab 1 Stück.', alternates: { canonical: catPath('auslaufartikel') } };
  const cats = getCategories(await viewCtx());
  const { base, g } = parseSlug(params.slug, cats);
  const sb = subBySlug(base);
  const c = cats.find((x) => x.slug === base);
  const h = sb ? sb.sub.title ?? sb.sub.label : c?.name;
  if (!h) return { title: 'Kategorie' };
  const hg = g ? `${h} ${gLabel(g)}` : h;
  return { title: `${hg} mit Logo bedrucken & besticken`, description: sb ? `${categoryContent(sb.cat, h, sb.sub.key).intro} Ab 1 Stück, Staffelpreise ab 10 Stück.` : g ? `${hg} bekannter Marken – bedruckt oder bestickt mit Ihrem Logo, schon ab 1 Stück. Staffelpreise ab 10 Stück, Angebot in 24 h.` : categoryContent(c!.slug, c!.name).intro, alternates: { canonical: catUrl(base, g) } };
}

export default async function CategoryView({ params, searchParams = {} }: { params: { slug: string }; searchParams?: SP }) {
  const ctx = await viewCtx();
  if (params.slug === 'sonderangebote' || params.slug === 'auslaufartikel') {
    const sale = params.slug === 'sonderangebote';
    const items = sale ? saleProducts(ctx) : eolProducts(ctx);
    const other = sale ? eolCount(ctx) : saleCount(ctx);
    const title = sale ? 'Sonderangebote' : 'Auslaufartikel';
    return (
      <>
        <JsonLd data={crumbSchema([['Start', '/'], [title, catPath(params.slug)]])} />
        <div className="crumbs"><Link href="/">Start</Link> › {title}</div>
        <section className="cat-hero deal-hero">
          <div className="cat-hero-text">
            <h1>{sale ? 'Sonderangebote' : 'Auslaufartikel & Restposten'}</h1>
            <p>{sale ? 'Ausgewählte Markentextilien zum Aktionspreis – solange die Aktion läuft. Auch hier gilt: bedruckt oder bestickt mit Ihrem Logo schon ab 1 Stück, Staffelpreise ab 10 Stück.' : 'Markentextilien, die beim Hersteller auslaufen – lieferbar solange Vorrat. Ideal für Aktionen, Events und Teams, die jetzt bestellen. Auch hier: bedruckt oder bestickt mit Ihrem Logo ab 1 Stück.'}</p>
          </div>
        </section>
        {other > 0 && <nav className="subchips" aria-label="Angebote">
          <Link href={catPath('sonderangebote')} className={sale ? 'on' : ''}>Sonderangebote <span>{sale ? items.length : other}</span></Link>
          <Link href={catPath('auslaufartikel')} className={!sale ? 'on' : ''}>Auslaufartikel <span>{sale ? other : items.length}</span></Link>
        </nav>}
        {items.length ? <FilterGrid items={items.map(slimCard)} /> : <div className="box muted">{sale ? <>Aktuell laufen keine Sonderangebote – schauen Sie bald wieder vorbei{other > 0 && <> oder stöbern Sie in unseren <Link className="alink" href={catPath('auslaufartikel')}>Auslaufartikeln</Link></>}.</> : 'Aktuell keine Auslaufartikel.'}</div>}
        {!sale && <p className="muted" style={{ fontSize: 13 }}>„Läuft aus“ heißt: Der Hersteller produziert den Artikel bzw. die Farbe nicht mehr nach. Bei größeren Mengen prüfen wir die Verfügbarkeit vor dem Angebot.</p>}
      </>
    );
  }
  const cats = getCategories(ctx);
  const ps = parseSlug(params.slug, cats);
  const sb = subBySlug(ps.base);
  const cat = cats.find((x) => x.slug === (sb ? sb.cat : ps.base));
  if (!cat) notFound();
  // alte Adressen (?typ=…, ?g=…) dauerhaft auf die sprechende URL umleiten
  const qg = GEN.includes(searchParams.g ?? '') ? searchParams.g! : null;
  const old = !sb && searchParams.typ ? subOf(cat.slug, searchParams.typ) : null;
  if (old || qg || sb?.old) permanentRedirect(catUrl(old?.key ?? sb?.sub.key ?? ps.base, qg ?? ps.g));
  const g = ps.g;
  const sub = sb?.sub ?? null;
  const all = getByCategory(cat.slug, ctx);
  const inSub = sub ? all.filter((p) => matchSub(sub, p.name)) : all;
  const items = inSub.filter(forG(g));
  if (!items.length && g) notFound();
  const allG = all.filter(forG(g));
  const subs = (SUBTYPES[cat.slug] ?? []).map((s) => ({ ...s, n: allG.filter((p) => matchSub(s, p.name)).length })).filter((s) => s.n >= 1 && s.n < allG.length && all.filter((p) => matchSub(s, p.name)).length >= 2);
  const gens = GEN.map((x) => ({ g: x, n: inSub.filter(forG(x)).length })).filter((x) => x.n > 0);
  const title = sub ? sub.title ?? sub.label : cat.name;
  const txt = categoryContent(cat.slug, cat.name, sub?.key);
  const rated = items.filter((p) => p.rating);
  const catRating = rated.length ? { avg: rated.reduce((s, p) => s + p.rating!.avg * p.rating!.count, 0) / rated.reduce((s, p) => s + p.rating!.count, 0), count: rated.reduce((s, p) => s + p.rating!.count, 0) } : null;
  const heroImgs = (g ? [...items.filter((p) => p.gender === g), ...items.filter((p) => p.gender !== g)] : items).flatMap((p) => p.images.slice(0, 1)).slice(0, 3);
  return (
    <>
      <JsonLd data={crumbSchema([['Start', '/'], [cat.name, catPath(cat.slug)], ...(sub ? [[title, catPath(sub.key)] as [string, string]] : []), ...(g ? [[`${title} ${gLabel(g)}`, catUrl(sub?.key ?? cat.slug, g)] as [string, string]] : [])])} />
      <JsonLd data={faqSchema(txt.faq)} />
      <div className="crumbs"><Link href="/">Start</Link> › {sub || g ? <Link href={catPath(cat.slug)}>{cat.name}</Link> : cat.name}{sub && <> › {g ? <Link href={catPath(sub.key)}>{title}</Link> : title}</>}{g && <> › {g}</>}</div>
      <section className="cat-hero">
        <div className="cat-hero-text">
          <h1>{title}{g && <> {gLabel(g)}</>}</h1>
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
        <Link href={catUrl(cat.slug, g)} className={!sub ? 'on' : ''}>Alle {cat.name} <span>{allG.length}</span></Link>
        {subs.map((s) => <Link key={s.key} href={catUrl(s.key, g)} className={sub?.key === s.key ? 'on' : ''}>{s.label} <span>{s.n}</span></Link>)}
      </nav>}
      {gens.length > 1 && <nav className="subchips gchips" aria-label="Zielgruppe">
        <Link href={catUrl(sub?.key ?? cat.slug)} className={!g ? 'on' : ''}>Alle <span>{inSub.length}</span></Link>
        {gens.map((x) => <Link key={x.g} href={catUrl(sub?.key ?? cat.slug, x.g)} className={g === x.g ? 'on' : ''}>{x.g} <span>{x.n}</span></Link>)}
      </nav>}
      {items.length >= 16 && <BestsellerRail items={bestsellersIn(items, 10).map(slimCard)} title={`Beliebt in ${title}${g ? ` ${gLabel(g)}` : ''}.`} sub="Die meistgefragten Artikel dieser Kategorie." />}
      <FilterGrid key={params.slug} items={items.map(slimCard)} />
      <RefStrip refs={refsFor({ category: cat.name, categorySlug: cat.slug })} title={`${cat.name} mit Logo – Beispiele unserer Kunden`} />
      <ReviewStrip reviews={latestReviews(6, items.map((p) => p.id))} overall={catRating} title={`Bewertungen zu ${cat.name}`} />
      <section className="cat-seo">
        <div><h2>{sub ? title : cat.name} mit Ihrem Logo</h2>{txt.seo.map((x) => <p key={x}>{x}</p>)}<p><Link className="alink" href="/druck-stick">Druck & Stick im Vergleich →</Link></p></div>
        <div className="faq"><h2>Häufige Fragen</h2>{txt.faq.map(([q, a]) => <details key={q} className="box"><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>
    </>
  );
}
