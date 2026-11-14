import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GUIDES, getGuide } from '@/lib/ratgeber';
import JsonLd, { crumbSchema, faqSchema } from '@/components/JsonLd';

export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = getGuide(params.slug);
  return g ? { title: g.title, description: g.description, alternates: { canonical: `/ratgeber/${g.slug}` }, openGraph: { type: 'article', title: g.title, description: g.description } } : {};
}

export default function Guide({ params }: { params: { slug: string } }) {
  const g = getGuide(params.slug);
  if (!g) notFound();
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  const more = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 3);
  return (
    <article className="info rg-article">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.description, inLanguage: 'de-DE', mainEntityOfPage: `${base}/ratgeber/${g.slug}`, author: { '@type': 'Organization', name: 'euro-trade.com' }, publisher: { '@type': 'Organization', name: 'euro-trade.com', logo: { '@type': 'ImageObject', url: `${base}/icon.svg` } } }} />
      <JsonLd data={faqSchema(g.faq)} />
      <JsonLd data={crumbSchema([['Start', '/'], ['Ratgeber', '/ratgeber'], [g.title, `/ratgeber/${g.slug}`]])} />
      <div className="crumbs"><Link href="/">Startseite</Link> › <Link href="/ratgeber">Ratgeber</Link> › {g.title}</div>
      <h1>{g.title}</h1>
      <p className="lead">{g.description}</p>
      <p className="rg-meta">{g.minutes} Min. Lesezeit</p>
      {g.sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p.map((t, k) => <p key={k}>{t}</p>)}
          {s.list && <ul className="rg-list">{s.list.map((t) => <li key={t}>{t}</li>)}</ul>}
        </section>
      ))}
      <h2>Häufige Fragen</h2>
      <div className="faq">{g.faq.map(([q, a], k) => <details key={q} className="box" open={k === 0}><summary>{q}</summary><p>{a}</p></details>)}</div>
      <div className="rg-cta">
        <div><b>Noch Fragen oder direkt ein Angebot?</b><span>Wir beraten Sie gerne – Antwort innerhalb von 24 Stunden.</span></div>
        <div className="rg-cta-links">{g.links.map(([href, label]) => <Link key={href} href={href} className="btn alt sm">{label}</Link>)}<Link href="/kontakt" className="btn sm">Anfrage stellen</Link></div>
      </div>
      <h2>Weitere Ratgeber</h2>
      <div className="rg-grid">{more.map((x) => <Link key={x.slug} href={`/ratgeber/${x.slug}`} className="rg-card"><span className="rg-ico" aria-hidden>{x.icon}</span><h3>{x.title}</h3><span className="rg-meta">Weiterlesen →</span></Link>)}</div>
    </article>
  );
}
