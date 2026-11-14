import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import TeamShopEditor from './TeamShopEditor';
import { listTeamShops, motifCounts, teamOrders, type TeamShop } from '@/lib/teamshop';
import { listInquiries } from '@/lib/store';
import { konditionen } from '@/lib/konditionen';
import { pickData } from '@/lib/pick';
import { METHODS, POSITIONS } from '@/lib/deco';
import { shopUrl } from '@/lib/mail';
import { getProduct } from '@/lib/catalog';
import { previewCheck } from '@/lib/image-fit';
import { productPath } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Team-Shops', robots: { index: false, follow: false } };

export default function TeamShops() {
  const shops = listTeamShops().map((t) => ({ ...t, orders: teamOrders(t.slug), stats: teamStats(t) }));
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

/** Auswertung je Shop: Umsatz, Stück, geschätzte Marge je Kalenderwoche + Top-Motive */
function teamStats(t: TeamShop) {
  const inqs = listInquiries().filter((i) => i.team === t.slug && i.status !== 'abgelehnt');
  const druck = new Map<string, { base: number; back: number }>();
  const druckOf = (id: string) => { if (!druck.has(id)) { const f = konditionen(id, t.slug)?.fixed; druck.set(id, { base: f?.druck ?? 0, back: f?.back?.druck ?? 0 }); } return druck.get(id)!; };
  const week = (d: string) => { const x = new Date(d); const t = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate())); const dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn); const y0 = Date.UTC(t.getUTCFullYear(), 0, 1); return `${t.getUTCFullYear()}-KW${String(Math.ceil(((t.getTime() - y0) / 864e5 + 1) / 7)).padStart(2, '0')}`; };
  const weeks = new Map<string, { orders: number; pieces: number; revenue: number; margin: number; paid: number }>();
  let missingEk = 0;
  for (const i of inqs) {
    const k = week(i.date); const w = weeks.get(k) ?? { orders: 0, pieces: 0, revenue: 0, margin: 0, paid: 0 };
    w.orders++; if (i.payment?.status === 'bezahlt') w.paid++;
    for (const l of i.lines) {
      const ek = l.ek ?? null; if (ek == null) missingEk += l.qty;
      const dr = l.incl && l.id ? druckOf(l.id) : { base: 0, back: 0 };
      const back = l.deco?.positions.includes('Rücken') && !t.positions.includes('Rücken') ? dr.back : 0;
      w.pieces += l.qty; w.revenue += l.sum; w.margin += l.qty * ((l.price ?? 0) - (ek ?? 0) - dr.base - back);
    }
    weeks.set(k, w);
  }
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const rows = [...weeks.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([w, v]) => ({ week: w, ...v, revenue: r2(v.revenue), margin: r2(v.margin) }));
  const n = motifCounts(t.slug);
  const names = new Map([...(t.motifs ?? []), ...(t.logos ?? []), ...(t.logoId ? [{ id: t.logoId, name: (t.logoName ?? 'Logo').replace(/\.[^.]+$/, '') }] : [])].map((m) => [m.id, m.name]));
  const top = Object.entries(n).filter(([id]) => names.has(id)).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, qty]) => ({ name: names.get(id)!, qty }));
  const tot = rows.reduce((a, r) => ({ orders: a.orders + r.orders, pieces: a.pieces + r.pieces, revenue: r2(a.revenue + r.revenue), margin: r2(a.margin + r.margin), paid: a.paid + r.paid }), { orders: 0, pieces: 0, revenue: 0, margin: 0, paid: 0 });
  return { rows, top, tot, missingEk };
}
