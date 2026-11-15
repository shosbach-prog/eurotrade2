import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import JsonLd, { crumbSchema } from '@/components/JsonLd';
import { collectionProducts } from '@/lib/catalog';
import { viewCtx } from '@/lib/customer';
import { slugify } from '@/lib/format';
import { kollektionBySlug } from '@/lib/kollektionen';

type SP = { thema?: string; textil?: string };

export function collectionMeta(slug: string) {
  const k = kollektionBySlug(slug);
  return k ? { title: k.title, description: k.description, alternates: { canonical: `/${k.slug}` } } : {};
}

/** Eigene Kollektion (z. B. /satire): alle Artikel mit Filter nach Thema und Textil */
export default async function CollectionView({ slug, searchParams }: { slug: string; searchParams?: SP }) {
  const k = kollektionBySlug(slug)!;
  const all = collectionProducts(k.key, await viewCtx());
  if (!all.length) notFound(); // alles noch Entwurf → Seite gibt es noch nicht
  const val = (p: (typeof all)[number], key: string) => p.specs?.[key] ?? '';
  const count = (key: string) => { const m = new Map<string, number>(); for (const p of all) { const v = val(p, key); if (v) m.set(v, (m.get(v) ?? 0) + 1); } return [...m.entries()]; };
  const themes = count(k.filter), textils = count(k.textil);
  const thema = themes.find(([t]) => slugify(t) === searchParams?.thema)?.[0] ?? null;
  const textil = textils.find(([t]) => slugify(t) === searchParams?.textil)?.[0] ?? null;
  const list = all.filter((p) => (!thema || val(p, k.filter) === thema) && (!textil || val(p, k.textil) === textil));
  const href = (t: string | null, x: string | null) => { const q = new URLSearchParams(); if (t) q.set('thema', slugify(t)); if (x) q.set('textil', slugify(x)); const s = q.toString(); return `/${k.slug}${s ? `?${s}` : ''}`; };
  return (
    <>
      <div className="crumbs"><Link href="/">Startseite</Link> › {k.name}</div>
      <JsonLd data={crumbSchema([['Start', '/'], [k.name, `/${k.slug}`]])} />
      <h1>{k.name}</h1>
      <p className="muted" style={{ maxWidth: 720 }}>{k.intro}</p>
      {<>
        <div className="chips" aria-label="Thema">
          <Link className={`chip ${!thema ? 'chip-on' : ''}`} href={href(null, textil)}>Alle Themen</Link>
          {themes.map(([t, n]) => <Link key={t} className={`chip ${thema === t ? 'chip-on' : ''}`} href={href(t, textil)}>{t} <span className="muted">{n}</span></Link>)}
        </div>
        {textils.length > 1 && <div className="chips" aria-label="Textil">
          <Link className={`chip ${!textil ? 'chip-on' : ''}`} href={href(thema, null)}>T-Shirt & Hoodie</Link>
          {textils.map(([t, n]) => <Link key={t} className={`chip ${textil === t ? 'chip-on' : ''}`} href={href(thema, t)}>{t} <span className="muted">{n}</span></Link>)}
        </div>}
        <p className="muted" style={{ marginTop: 16 }}>{list.length} Artikel · Festpreis inkl. Druck</p>
        <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </>}
    </>
  );
}
