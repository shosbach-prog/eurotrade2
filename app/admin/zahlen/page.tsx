import type { Metadata } from 'next';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import { listInquiries, offerTotals } from '@/lib/store';
import { inquiryMargin } from '@/lib/margin';
import { amountDue, invoiceTotals, listInvoices } from '@/lib/invoice';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Zahlen', robots: { index: false, follow: false } };
const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const WON = ['angenommen', 'bestellt', 'geliefert'];

export default function Zahlen() {
  const inqs = listInquiries(), invs = listInvoices().filter((i) => i.no);
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, k) => { const d = new Date(now.getFullYear(), now.getMonth() - k, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const rows = months.map((m) => {
    const q = inqs.filter((i) => i.date.startsWith(m));
    const sent = q.filter((i) => i.offer?.sentAt), won = q.filter((i) => WON.includes(i.status ?? ''));
    const margins = won.map(inquiryMargin).filter(Boolean) as NonNullable<ReturnType<typeof inquiryMargin>>[];
    const inv = invs.filter((i) => i.date.startsWith(m) && i.kind !== 'abschlag' && !((i.kind === 'storno' || i.kind === 'gutschrift') && i.refNo && invs.find((x) => x.no === i.refNo)?.kind === 'abschlag')).reduce((s, i) => s + (i.kind === 'storno' || i.kind === 'gutschrift' ? -1 : 1) * invoiceTotals(i).net, 0);
    const paid = invs.filter((i) => i.paidAt?.startsWith(m) && i.kind !== 'storno' && i.kind !== 'gutschrift').reduce((s, i) => s + Math.max(0, invoiceTotals(i).gross - (i.prepaid ?? []).reduce((a, p) => a + p.gross, 0) - (i.credits ?? []).reduce((a, c) => a + c.gross, 0)), 0);
    return { m, inquiries: q.length, sent: sent.length, won: won.length, rate: sent.length ? Math.round((won.length / sent.length) * 100) : null, value: won.reduce((s, i) => s + (i.offer ? offerTotals(i.offer).net : 0), 0), margin: margins.reduce((s, x) => s + x.margin, 0), revenue: margins.reduce((s, x) => s + x.revenue, 0), inv, paid };
  });
  const y = String(now.getFullYear());
  const yr = rows.filter((r) => r.m.startsWith(y));
  const sum = (k: keyof (typeof rows)[number]) => yr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const ySent = sum('sent'), yWon = sum('won'), yRev = sum('revenue'), yMargin = sum('margin');
  const max = Math.max(1, ...rows.map((r) => r.inv));
  const pipeline = inqs.filter((i) => i.status === 'angebot' && i.offer).reduce((s, i) => s + offerTotals(i.offer!).net, 0);
  const open = invs.filter((i) => i.status === 'offen' && i.kind !== 'storno' && i.kind !== 'gutschrift').reduce((s, i) => s + amountDue(i), 0);
  // meistverkaufte Artikel (angenommene Aufträge, laufendes Jahr)
  const top = new Map<string, { name: string; qty: number }>();
  for (const i of inqs) if (i.date.startsWith(y) && WON.includes(i.status ?? '')) for (const l of i.lines) { const e = top.get(l.sku) ?? { name: l.name, qty: 0 }; e.qty += l.qty; top.set(l.sku, e); }
  const topList = [...top.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 8);
  const label = (m: string) => new Date(m + '-01').toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
  return (
    <>
      <AdminNav active="zahlen" />
      <h1>Zahlen {y}</h1>
      <div className="inv-stats">
        <div><span>Rechnungen netto {y}</span><b>{eur(sum('inv'))}</b></div>
        <div><span>Marge (geschätzt)</span><b>{eur(yMargin)}</b><small className="muted">{yRev ? `${Math.round((yMargin / yRev) * 100)} % vom Auftragswert` : '–'}</small></div>
        <div><span>Annahmequote Angebote</span><b>{ySent ? `${Math.round((yWon / ySent) * 100)} %` : '–'}</b><small className="muted">{yWon} von {ySent}</small></div>
        <div><span>Ø Auftragswert netto</span><b>{yWon ? eur(sum('value') / yWon) : '–'}</b></div>
        <div><span>Offene Angebote</span><b>{eur(pipeline)}</b></div>
        <div><span>Offene Rechnungen</span><b>{eur(open)}</b></div>
      </div>
      <div className="box" style={{ overflowX: 'auto' }}>
        <table className="atable z-table">
          <thead><tr><th>Monat</th><th>Anfragen</th><th>Angebote</th><th>Aufträge</th><th>Quote</th><th>Auftragswert</th><th>Marge</th><th style={{ width: '28%' }}>Rechnungen netto</th><th>Zahlungseingang</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.m}>
            <td><b>{label(r.m)}</b></td><td>{r.inquiries}</td><td>{r.sent}</td><td>{r.won}</td><td>{r.rate != null ? `${r.rate} %` : '–'}</td><td>{eur(r.value)}</td>
            <td className={r.revenue && r.margin / r.revenue < 0.15 ? 'err' : ''}>{eur(r.margin)}</td>
            <td><div className="z-bar"><i style={{ width: `${(r.inv / max) * 100}%` }} /><span>{eur(r.inv)}</span></div></td><td>{eur(r.paid)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="sys-grid" style={{ marginTop: 16 }}>
        <section className="box"><h2>Meistverkaufte Artikel {y}</h2>{topList.length ? <ol className="z-top">{topList.map(([sku, e]) => <li key={sku}><span>{e.name}</span><b>{e.qty} Stk.</b></li>)}</ol> : <p className="muted">Noch keine angenommenen Aufträge.</p>}</section>
        <section className="box"><h2>So wird gerechnet</h2><p className="muted" style={{ fontSize: 14 }}>Marge = Angebot netto (ohne Versand) − Einkaufspreis Textil (aus dem Katalog zum Zeitpunkt der Anfrage) − Kosten der Veredelung in % vom Verkaufspreis. Den Prozentsatz stellen Sie unter <Link className="alink" href="/admin/veredelung">Veredelung</Link> ein. Rechnungen: festgeschriebene Rechnungen abzüglich Stornos.</p></section>
      </div>
    </>
  );
}
