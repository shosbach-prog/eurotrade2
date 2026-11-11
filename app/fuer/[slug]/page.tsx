import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import JsonLd, { crumbSchema, faqSchema } from '@/components/JsonLd';
import CategoryTiles from '@/components/CategoryTiles';
import QuoteForm from '../../start/QuoteForm';
import { ZIELGRUPPEN, zielgruppe } from '@/lib/zielgruppen';
import { categoryTiles, getCategories } from '@/lib/catalog';
import { previewMode } from '@/lib/access';

export const dynamic = 'force-dynamic';
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const z = zielgruppe(params.slug);
  return z ? { title: z.title, description: z.desc, alternates: { canonical: `/fuer/${z.slug}` } } : {};
}

export default function Branche({ params }: { params: { slug: string } }) {
  const z = zielgruppe(params.slug);
  if (!z) notFound();
  const tiles = categoryTiles(undefined, z.cats).sort((a, b) => z.cats.indexOf(a.slug) - z.cats.indexOf(b.slug));
  return (
    <div className="landing">
      <JsonLd data={crumbSchema([['Start', '/'], [z.nav, `/fuer/${z.slug}`]])} />
      <JsonLd data={faqSchema(z.faq)} />
      <section className="l-hero z-hero">
        <div className="l-hero-text">
          <span className="l-kicker">Für {z.nav}</span>
          <h1>{z.h1}</h1>
          <p>{z.lead}</p>
          <div className="l-cta">
            <a href="#anfragen" className="btn l-btn">Preis anfragen</a>
            <Link href="/druck-stick" className="btn alt l-btn2">Druck & Stick erklärt</Link>
          </div>
          <ul className="l-checks"><li>Ab 1 Stück</li><li>Angebot in 24 Stunden</li><li>Vorschau vor der Produktion</li></ul>
        </div>
        {tiles[0]?.image && <div className="z-hero-img">{tiles.slice(0, 3).filter((t) => t.image).map((t) => <img key={t.slug} src={t.image} alt="" />)}</div>}
      </section>

      <section className="l-feats">{z.points.map(([t, x]) => <div key={t} className="l-feat box"><h3>{t}</h3><p>{x}</p></div>)}</section>

      {tiles.length > 0 && (
        <section className="l-section">
          <h2>Beliebt bei {z.dativ}</h2>
          <CategoryTiles tiles={tiles} link={!previewMode()} />
        </section>
      )}

      <section className="l-section">
        <h2>Häufige Fragen</h2>
        <div className="faq">{z.faq.map(([q, a], k) => <details key={q} className="box" open={k === 0}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>

      <section id="anfragen" className="l-section">
        <QuoteForm categories={getCategories().map((c) => c.name)} aside={<>
          <h2>Unverbindlich Preis anfragen</h2>
          <p>Beschreiben Sie kurz Ihr Vorhaben – {z.example}. Sie erhalten innerhalb von 24 Stunden ein Angebot.</p>
          <ul><li>Kein Zugangscode nötig</li><li>Logo gleich mitschicken</li><li>Vorschau vor der Produktion</li></ul>
          <p className="muted" style={{ marginTop: 16 }}>Lieber sprechen? Produktberatung: <a className="alink" href="tel:+493040719258">030 40719258</a></p>
          <p className="muted" style={{ marginTop: 18, fontSize: 14 }}>Auch für: {ZIELGRUPPEN.filter((x) => x.slug !== z.slug).map((x, k) => <span key={x.slug}>{k > 0 && ' · '}<Link className="alink" href={`/fuer/${x.slug}`}>{x.nav}</Link></span>)}</p>
        </>} />
      </section>
    </div>
  );
}
