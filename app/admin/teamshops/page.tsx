import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import TeamShopEditor from './TeamShopEditor';
import { listTeamShops, teamOrders } from '@/lib/teamshop';
import { pickData } from '@/lib/pick';
import { METHODS, POSITIONS } from '@/lib/deco';
import { shopUrl } from '@/lib/mail';
import { getProduct } from '@/lib/catalog';
import { previewCheck } from '@/lib/image-fit';
import { productPath } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Team-Shops', robots: { index: false, follow: false } };

export default function TeamShops() {
  const shops = listTeamShops().map((t) => ({ ...t, orders: teamOrders(t.slug) }));
  return (
    <>
      <AdminNav active="teamshops" />
      <h1>Team-Shops</h1>
      <p className="muted" style={{ marginTop: -6, maxWidth: 820 }}>Eigener Shop-Link pro Verein oder Firma: Vereinslogo und Veredelung sind fest eingestellt, Mitglieder wählen nur Artikel, Größe und ggf. Name/Nummer. Alle Bestellungen laufen hier als Sammelbestellung zusammen.</p>
      {(() => {
        // Prüfliste: Artikel der Team-Shops, deren Motiv-Lage auf Fotos nicht sicher erkannt ist
        const seen = new Set<string>(); const rows: { id: string; name: string; sku: string; href: string; shop: string; bad: string[]; fixed: number; total: number }[] = [];
        for (const t of shops) for (const id of t.items) {
          if (seen.has(id)) continue; seen.add(id);
          const p = getProduct(id, null); if (!p) continue;
          const chk = previewCheck(p, t.positions);
          const bad = chk.filter((c) => c.status === 'korrigiert' || c.status === 'skizze');
          if (bad.length) rows.push({ id, name: p.name, sku: p.sku, href: `${productPath(p)}?team=${t.slug}`, shop: t.name, bad: bad.map((b) => `${b.color} (${b.status === 'skizze' ? 'nur Skizze' : 'korrigiert'})`), fixed: chk.filter((c) => c.status === 'anker').length, total: chk.length });
        }
        if (!rows.length) return null;
        return <details className="box ts-check"><summary><b>Vorschau prüfen</b> – bei {rows.length} Artikel{rows.length === 1 ? '' : 'n'} ist die Motiv-Lage auf einzelnen Fotos unsicher</summary>
          <p className="muted" style={{ fontSize: 13 }}>Artikel öffnen, Farbe wählen, Motiv an die richtige Stelle ziehen und „Lage speichern“ – gilt dann für alle Kunden.</p>
          <table className="atable"><thead><tr><th>Artikel</th><th>Shop</th><th>Unsichere Fotos</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.id}><td><a className="alink" href={r.href} target="_blank">{r.sku} {r.name}</a></td><td>{r.shop}</td><td style={{ fontSize: 13 }}>{r.bad.join(', ')}</td></tr>)}</tbody></table>
        </details>;
      })()}
      <TeamShopEditor shops={shops} {...(() => { const d = pickData(); return { products: d.items, groups: d.groups }; })()} methods={METHODS} positions={POSITIONS} base={shopUrl()} />
    </>
  );
}
