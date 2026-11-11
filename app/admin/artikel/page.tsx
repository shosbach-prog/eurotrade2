import Link from 'next/link';
import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import NewArticle from './NewArticle';
import { adminProducts } from '@/lib/catalog';
import { readOverrides } from '@/lib/artikel';
import { sellPrice } from '@/lib/pricing';
import { getText } from '@/lib/content';
import { eur } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Artikel', robots: { index: false, follow: false } };
const LBL = { eigen: ['Bearbeitet', 'st-angenommen'], vorlage: ['Vorlage', 'st-angebot'], automatisch: ['Automatisch', 'st-neu'] } as const;

export default function Artikel() {
  const ov = readOverrides();
  const rows = adminProducts();
  const cats = [...new Set(rows.map((p) => p.category))].sort();
  return (
    <>
      <AdminNav active="artikel" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ marginRight: 'auto' }}>Artikel <span className="muted" style={{ fontSize: 16, fontWeight: 500 }}>({rows.length})</span></h1>
        <NewArticle categories={cats} />
      </div>
      <p className="muted" style={{ marginTop: -4 }}>Name, Preise, Bilder, Farben, Größen, Sichtbarkeit und Verkaufstext je Artikel bearbeiten. Ihre Änderungen bleiben auch bei Katalog-Updates erhalten.</p>
      <div className="box" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="atable">
          <thead><tr><th></th><th>Artikel</th><th>Kategorie</th><th style={{ textAlign: 'right' }}>EK</th><th style={{ textAlign: 'right' }}>VK</th><th>Status</th><th>Text</th><th></th></tr></thead>
          <tbody>{rows.map((p) => {
            const src = getText(p).source;
            const img = p.images[0]?.replace(/^\/api\/bild\//, '/api/upload/');
            return (
              <tr key={p.id} style={p.hidden ? { opacity: 0.55 } : undefined}>
                <td style={{ width: 52 }}>{img ? <img src={img} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} /> : <span className="ae-noimg" />}</td>
                <td><b>{p.name}</b><div className="muted" style={{ fontSize: 12 }}>{p.sku} · {p.brand}{p.top ? ' · ★ Top' : ''}</div></td>
                <td>{p.category}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{p.basePrice ? eur(p.basePrice) : <span className="muted">–</span>}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{p.basePrice ? eur(sellPrice(p.basePrice, p.categorySlug)) : <span className="muted">auf Anfrage</span>}</td>
                <td>{p.hidden ? <span className="st st-abgelehnt">Ausgeblendet</span> : <span className="st st-angenommen">Sichtbar</span>}{ov[p.id] && !p.custom && <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>geändert</div>}{p.custom && <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>eigener Artikel</div>}</td>
                <td><span className={`st ${LBL[src][1]}`}>{LBL[src][0]}</span></td>
                <td><Link className="btn alt" style={{ height: 34, display: 'inline-grid', placeItems: 'center' }} href={`/admin/artikel/${p.id}`}>Bearbeiten</Link></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </>
  );
}
