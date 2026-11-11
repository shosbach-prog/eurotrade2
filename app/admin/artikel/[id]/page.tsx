import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import TextEditor from './TextEditor';
import ArticleEditor from './ArticleEditor';
import { adminProduct, adminProducts } from '@/lib/catalog';
import { readOverrides } from '@/lib/artikel';
import { markupFor } from '@/lib/pricing';
import { generateText, getText, seedText } from '@/lib/content';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Artikel bearbeiten', robots: { index: false, follow: false } };
export default function EditArticle({ params }: { params: { id: string } }) {
  const { p, original } = adminProduct(decodeURIComponent(params.id));
  if (!p) notFound();
  const { text, source } = getText(p);
  const categories = [...new Set(adminProducts().map((x) => x.category))].sort();
  const specs = Object.entries(p.specs ?? {}).filter(([, v]) => v && v !== 'Keine Angabe');
  return (
    <>
      <AdminNav active="artikel" />
      <div className="crumbs"><Link href="/admin/artikel">Artikel</Link> › {p.name}</div>
      <h1 style={{ marginBottom: 4 }}>{p.name}</h1>
      <p className="muted" style={{ marginTop: 0 }}>{p.sku} · {p.brand} · {p.hidden ? 'ausgeblendet' : <Link className="alink" href={`/produkt/${p.id}`} target="_blank">Im Shop ansehen ↗</Link>}</p>

      <ArticleEditor key={JSON.stringify(readOverrides()[p.id]?.updatedAt ?? '')} p={p} custom={!original} changed={!!readOverrides()[p.id]} categories={categories} markup={markupFor(p.categorySlug)} />

      <h2 style={{ marginTop: 34 }}>Verkaufstext</h2>
      <div className="te-grid">
        <TextEditor id={p.id} initial={text} source={source} auto={generateText(p)} seed={seedText(p.id)} />
        <aside className="box te-facts">
          <strong>Fakten aus den Produktdaten</strong>
          <p className="muted" style={{ fontSize: 12, margin: '4px 0 10px' }}>Nur diese Angaben sind belegt. Bitte im Text nichts behaupten, was hier nicht steht.</p>
          <dl className="specs" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
            {p.material && <><dt>Material</dt><dd>{p.material}</dd></>}
            {p.composition && <><dt>Zusammensetzung</dt><dd>{p.composition}</dd></>}
            <dt>Größen</dt><dd>{p.sizes.join(', ') || '–'}</dd>
            <dt>Farben</dt><dd>{p.colors.length}</dd>
            {specs.map(([k, v]) => <><dt key={k}>{k}</dt><dd>{v}</dd></>)}
          </dl>
          {p.features?.length ? <><strong style={{ fontSize: 13 }}>Merkmale</strong><ul className="feat" style={{ marginTop: 6 }}>{p.features.map((f) => <li key={f}>{f}</li>)}</ul></> : null}
        </aside>
      </div>
    </>
  );
}
