import Link from 'next/link';
import type { Metadata } from 'next';
import { viewCtx } from '@/lib/customer';
import { brandList } from '@/lib/brand-catalog';
import JsonLd, { crumbSchema } from '@/components/JsonLd';
import { brandText } from '@/lib/brand-texts';

export const metadata: Metadata = { title: 'Marken & Hersteller', description: 'Alle Textilmarken bei Euro-Trade: B&C, Build Your Brand, Result, Russell, Fruit of the Loom, Stedman und viele mehr – bedruckt oder bestickt ab 1 Stück.', alternates: { canonical: '/marken' } };

export default async function Marken() {
  const ctx = await viewCtx();
  const list = brandList(ctx);
  const withItems = list.filter((b) => b.count > 0);
  const more = list.filter((b) => !b.count);
  const tile = (b: (typeof list)[number]) => {
    const inner = <>
      <span className="bt-logo">{b.logo ? <img src={`/brands/${b.logo}`} alt={b.name} loading="lazy" /> : <b>{b.name}</b>}</span>
      <span className="bt-name">{b.name}</span>
      {brandText(b.name) && <span className="bt-txt">{brandText(b.name)!.f.join(' · ')}</span>}
      <span className="bt-n">{b.count ? `${b.count} Artikel` : 'auf Anfrage'}</span>
    </>;
    return b.count ? <Link key={b.slug} href={`/marken/${b.slug}`} className="btile">{inner}</Link>
      : <Link key={b.slug} href={`/kontakt?marke=${encodeURIComponent(b.name)}`} className="btile off">{inner}</Link>;
  };
  return (
    <>
      <JsonLd data={crumbSchema([['Start', '/'], ['Marken', '/marken']])} />
      <div className="crumbs"><Link href="/">Start</Link> › Marken</div>
      <h1>Marken & Hersteller</h1>
      <p className="muted" style={{ maxWidth: 760 }}>Wir arbeiten mit über {list.length} Textilmarken. Alle Artikel gibt es schon ab 1 Stück – auf Wunsch mit Ihrem Logo bedruckt oder bestickt.</p>
      {withItems.length > 0 && <><h2>Im Shop</h2><div className="bgrid">{withItems.map(tile)}</div></>}
      {more.length > 0 && <><h2>Weitere Marken auf Anfrage</h2><p className="muted" style={{ marginTop: -6 }}>Artikel dieser Hersteller besorgen wir Ihnen gern – einfach anfragen.</p><div className="bgrid">{more.map(tile)}</div></>}
    </>
  );
}
