import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import JsonLd, { crumbSchema, faqSchema } from '@/components/JsonLd';
import ProductCard from '@/components/ProductCard';
import RefStrip from '@/components/RefStrip';
import QuoteForm from '../../start/QuoteForm';
import { AKTIONEN, aktion } from '@/lib/aktionen';
import { allPublic, getCategories, slimCard } from '@/lib/catalog';
import { viewCtx } from '@/lib/customer';
import { listReferences } from '@/lib/store';
import { LEAD, fmtDate, subWorkdays } from '@/lib/leadtime';

export const dynamic = 'force-dynamic';
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = aktion(params.slug);
  return a ? { title: a.title, description: a.desc, alternates: { canonical: `/aktion/${a.slug}` } } : {};
}

export default async function Aktion({ params }: { params: { slug: string } }) {
  const a = aktion(params.slug);
  if (!a) notFound();
  const ctx = await viewCtx();
  const all = allPublic(ctx).filter((p) => p.images.length);
  const items = all.map((p) => [p, a.pick(p)] as const).filter(([, s]) => s > 0).sort((x, y) => y[1] - x[1]).slice(0, 16).map(([p]) => slimCard(p));
  const refs = listReferences().filter((r) => r.imageId && a.refMatch.some((m) => `${r.tag} ${r.match} ${r.title}`.toLowerCase().includes(m))).slice(0, 3);
  // Stichtag: späteste Freigabe = Liefertermin − Produktion − Versand
  let dl: { date: Date; approve: Date } | null = null;
  if (a.deadline) {
    const now = new Date(); const [m, d] = a.deadline.split('-').map(Number);
    let date = new Date(now.getFullYear(), m - 1, d);
    if (date.getTime() < now.getTime()) date = new Date(now.getFullYear() + 1, m - 1, d);
    dl = { date, approve: subWorkdays(date, LEAD.deco + LEAD.ship) };
  }
  return (
    <div className="landing">
      <JsonLd data={crumbSchema([['Start', '/'], [a.nav, `/aktion/${a.slug}`]])} />
      <JsonLd data={faqSchema(a.faq)} />
      <section className="l-hero z-hero">
        <div className="l-hero-text">
          <span className="l-kicker">{a.kicker}</span>
          <h1>{a.h1}</h1>
          <p>{a.lead}</p>
          {dl && <p className="akt-dl">📅 {a.deadlineLabel}: Vorschau bitte bis <b>{fmtDate(dl.approve)}</b> freigeben.</p>}
          <div className="l-cta">
            <a href="#anfragen" className="btn l-btn">Preis anfragen</a>
            {items.length > 0 && <a href="#artikel" className="btn alt l-btn2">Artikel ansehen</a>}
          </div>
          <ul className="l-checks"><li>Ab 1 Stück</li><li>Angebot in 24 Stunden</li><li>Vorschau vor der Produktion</li></ul>
        </div>
        {items[0] && <div className="z-hero-img">{items.slice(0, 3).filter((p) => p.images[0]).map((p) => <img key={p.id} src={p.images[0]} alt="" />)}</div>}
      </section>
      <section className="l-feats">{a.points.map(([t, x]) => <div key={t} className="l-feat box"><h3>{t}</h3><p>{x}</p></div>)}</section>
      {a.groups ? <div id="artikel">{a.groups.map((g) => {
        const used = new Set<string>();
        const list = all.filter((p) => g.pick(p) && !used.has(p.id)).slice(0, 8);
        list.forEach((p) => used.add(p.id));
        return list.length ? <section key={g.title} className="l-section"><h2>{g.title}</h2><p className="muted" style={{ marginTop: -6, maxWidth: 760 }}>{g.text}</p><div className="grid">{list.map((p) => <ProductCard key={p.id} p={slimCard(p)} />)}</div></section> : null;
      })}</div>
      : items.length > 0 && <section className="l-section" id="artikel"><h2>Unsere Empfehlungen</h2><div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div></section>}
      <RefStrip refs={refs} />
      <section className="l-section">
        <h2>Häufige Fragen</h2>
        <div className="faq">{a.faq.map(([q, x], k) => <details key={q} className="box" open={k === 0}><summary>{q}</summary><p>{x}</p></details>)}</div>
      </section>
      <section id="anfragen" className="l-section">
        <QuoteForm categories={getCategories().map((c) => c.name)} aside={<>
          <h2>Unverbindlich Preis anfragen</h2>
          <p>Beschreiben Sie kurz Ihr Vorhaben – {a.example}. Sie erhalten innerhalb von 24 Stunden ein Angebot.</p>
          <ul><li>Kein Zugangscode nötig</li><li>Logo gleich mitschicken</li><li>Vorschau vor der Produktion</li></ul>
          <p className="muted" style={{ marginTop: 16 }}>Lieber sprechen? Produktberatung: <a className="alink" href="tel:+493040719258">030 40719258</a></p>
          <p className="muted" style={{ marginTop: 18, fontSize: 14 }}>Weitere Aktionen: {AKTIONEN.filter((x) => x.slug !== a.slug).map((x, k) => <span key={x.slug}>{k > 0 && ' · '}<Link className="alink" href={`/aktion/${x.slug}`}>{x.nav}</Link></span>)}</p>
        </>} />
      </section>
    </div>
  );
}
