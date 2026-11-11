import Link from 'next/link';
import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import { allProductsBrief, getProduct } from '@/lib/catalog';
import { getText } from '@/lib/content';

export const metadata: Metadata = { title: 'Artikeltexte', robots: { index: false, follow: false } };
const LBL = { eigen: ['Bearbeitet', 'st-angenommen'], vorlage: ['Redaktionelle Vorlage', 'st-angebot'], automatisch: ['Automatisch aus Daten', 'st-neu'] } as const;

export default function Artikel() {
  const rows = allProductsBrief().map((b) => { const p = getProduct(b.id); return p ? { p, ...getText(p) } : null; }).filter(Boolean) as { p: NonNullable<ReturnType<typeof getProduct>>; source: keyof typeof LBL; text: { headline: string } }[];
  return (
    <>
      <AdminNav active="artikel" />
      <h1>Artikeltexte</h1>
      <p className="muted" style={{ marginTop: -8 }}>Verkaufstexte je Artikel: Überschrift, Einleitung, Highlights und Einsatzbereiche. Neue Artikel erhalten automatisch einen Text aus den Produktdaten, den Sie hier verfeinern können. Bitte nur belegbare Eigenschaften nennen.</p>
      <div className="box" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="atable">
          <thead><tr><th></th><th>Artikel</th><th>Überschrift</th><th>Text</th><th></th></tr></thead>
          <tbody>{rows.map(({ p, source, text }) => (
            <tr key={p.id}>
              <td style={{ width: 52 }}>{p.images[0] && <img src={p.images[0]} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />}</td>
              <td><b>{p.name}</b><div className="muted" style={{ fontSize: 12 }}>{p.sku} · {p.brand}</div></td>
              <td>{text.headline}</td>
              <td><span className={`st ${LBL[source][1]}`}>{LBL[source][0]}</span></td>
              <td><Link className="btn alt" style={{ height: 34, display: 'inline-grid', placeItems: 'center' }} href={`/admin/artikel/${p.id}`}>Bearbeiten</Link></td>
            </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
