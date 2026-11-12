import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import NewArticle from './NewArticle';
import ArticleImport from './ArticleImport';
import ArticleList, { type Row } from './ArticleList';
import { adminProducts } from '@/lib/catalog';
import { readOverrides } from '@/lib/artikel';
import { sellPrice } from '@/lib/pricing';
import { getText } from '@/lib/content';
import fs from 'node:fs';
import path from 'node:path';
import KalkEditor from './KalkEditor';
import { getKalk } from '@/lib/kalkulation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Artikel', robots: { index: false, follow: false } };

export default function Artikel() {
  const ov = readOverrides();
  const all = adminProducts();
  const rows: Row[] = all.map((p) => ({
    id: p.id, name: p.name, sku: p.sku, brand: p.brand, category: p.category,
    ek: p.basePrice ?? null, vk: p.basePrice ? sellPrice(p.basePrice, p.categorySlug) : null,
    hidden: !!p.hidden, top: !!p.top, changed: !!ov[p.id] && !p.custom, custom: !!p.custom,
    text: getText(p).source, img: p.images[0]?.replace(/^\/api\/bild\//, '/api/upload/') ?? null,
    colors: p.colors.length, placeholder: (p.tags ?? []).includes('Platzhalter'), eol: p.eol ? (p.eol.all ? `Auslauf${p.eol.date ? ` ${p.eol.date.split('-').reverse().join('.')}` : ''}` : `${Object.keys(p.eol.colors).length} Farbe(n) laufen aus`) : null,
  }));
  const cats = [...new Set(all.map((p) => p.category))].sort();
  return (
    <>
      <AdminNav active="artikel" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ marginRight: 'auto', marginBottom: 4 }}>Artikel <span className="muted" style={{ fontSize: 16, fontWeight: 500 }}>({rows.length})</span></h1>
        <NewArticle categories={cats} />
      </div>
      <p className="muted" style={{ marginTop: 0 }}>Suchen, filtern, mehrere Artikel auf einmal sichtbar schalten oder einer Kategorie zuordnen. Ihre Änderungen bleiben auch bei Katalog-Updates erhalten.</p>
      <ArticleImport placeholders={rows.filter((r) => r.placeholder).length} />
      <KalkEditor initial={getKalk()} custom={fs.existsSync(path.join(process.cwd(), 'data', 'kalkulation.json'))} items={adminProducts().filter((p) => p.basePrice).map((p) => ({ sku: p.sku, name: p.name, ek: p.basePrice!, category: p.category }))} />
      <ArticleList rows={rows} categories={cats} />
    </>
  );
}
