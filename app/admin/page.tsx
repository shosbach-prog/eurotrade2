import Link from 'next/link';
import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import { eur } from '@/lib/format';
import { STATUS, listInquiries, offerTotals, type Status } from '@/lib/store';

export const metadata: Metadata = { title: 'Anfragen', robots: { index: false, follow: false } };
const fmt = (d: string) => new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function AdminHome({ searchParams }: { searchParams: { status?: string } }) {
  const all = listInquiries();
  const filter = searchParams.status as Status | undefined;
  const items = filter && STATUS[filter] ? all.filter((i) => i.status === filter) : all;
  const count = (s: Status) => all.filter((i) => i.status === s).length;
  return (
    <>
      <AdminNav active="anfragen" />
      <h1>Anfragen & Angebote</h1>
      <div className="chips" style={{ margin: '0 0 16px' }}>
        <Link className={`chip ${!filter ? 'chip-on' : ''}`} href="/admin">Alle ({all.length})</Link>
        {(Object.keys(STATUS) as Status[]).map((s) => <Link key={s} className={`chip ${filter === s ? 'chip-on' : ''}`} href={`/admin?status=${s}`}>{STATUS[s]} ({count(s)})</Link>)}
      </div>
      {!items.length ? <div className="box muted">Noch keine Anfragen{filter ? ' mit diesem Status' : ''}.</div> : (
        <div className="box" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="atable">
            <thead><tr><th>Nr.</th><th>Datum</th><th>Kunde</th><th>Code</th><th>Stück</th><th>Betrag</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.no}>
                  <td><Link href={`/admin/anfrage/${i.no}`} className="alink">{i.no}</Link></td>
                  <td>{fmt(i.date)}</td>
                  <td><strong>{i.customer.company || i.customer.name}</strong>{i.customer.company && <div className="muted" style={{ fontSize: 12 }}>{i.customer.name}</div>}</td>
                  <td className="muted">{i.zugangscode ?? '–'}</td>
                  <td>{i.lines.reduce((s, l) => s + l.qty, 0)}{i.lines.some((l) => l.deco) && <span title="mit Veredelung"> ✦</span>}</td>
                  <td>{i.offer ? <>{eur(offerTotals(i.offer).net)} <span className="muted" style={{ fontSize: 12 }}>Angebot</span></> : eur(i.total)}</td>
                  <td><span className={`st st-${i.status}`}>{STATUS[i.status!]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
