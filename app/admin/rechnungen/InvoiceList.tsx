'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Row = { id: string; no: string | null; kind: string; status: string; date: string; due: string | null; customer: string; gross: number; net: number; overdue: boolean; sent: boolean; reminders: number; inquiryNo: string | null };
const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const d = (s: string) => new Date(s).toLocaleDateString('de-DE');
const LABEL: Record<string, string> = { entwurf: 'Entwurf', offen: 'Offen', bezahlt: 'Bezahlt', storniert: 'Storniert' };
const CLS: Record<string, string> = { entwurf: 'neu', offen: 'angebot', bezahlt: 'angenommen', storniert: 'abgelehnt' };

export default function InvoiceList({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [f, setF] = useState<'alle' | 'offen' | 'ueberfaellig' | 'bezahlt' | 'entwurf'>('alle');
  const [q, setQ] = useState('');
  const year = String(new Date().getFullYear());
  const stats = useMemo(() => ({
    open: rows.filter((r) => r.status === 'offen' && r.kind !== 'storno').reduce((s, r) => s + r.gross, 0),
    overdue: rows.filter((r) => r.overdue).reduce((s, r) => s + r.gross, 0),
    year: rows.filter((r) => r.no && r.date.startsWith(year) && r.status !== 'storniert' && r.kind === 'rechnung').reduce((s, r) => s + r.net, 0),
    drafts: rows.filter((r) => r.status === 'entwurf').length,
  }), [rows, year]);
  const shown = rows.filter((r) => (f === 'alle' || (f === 'ueberfaellig' ? r.overdue : r.status === f)) && (!q || `${r.no} ${r.customer} ${r.inquiryNo}`.toLowerCase().includes(q.toLowerCase())));
  async function create() {
    const r = await fetch('/api/admin/rechnungen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'new' }) });
    const x = await r.json(); if (x.id) router.push(`/admin/rechnungen/${x.id}`);
  }
  return (
    <>
      <div className="inv-stats">
        <div><span>Offen</span><b>{eur(stats.open)}</b></div>
        <div className={stats.overdue > 0 ? 'bad' : ''}><span>Überfällig</span><b>{eur(stats.overdue)}</b></div>
        <div><span>Umsatz {year} netto</span><b>{eur(stats.year)}</b></div>
        <div><span>Entwürfe</span><b>{stats.drafts}</b></div>
      </div>
      <div className="inv-bar">
        <div className="seg">{([['alle', 'Alle'], ['offen', 'Offen'], ['ueberfaellig', 'Überfällig'], ['bezahlt', 'Bezahlt'], ['entwurf', 'Entwürfe']] as const).map(([k, l]) => <button key={k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{l}</button>)}</div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen: Nr., Kunde, Anfrage …" />
        <span style={{ flex: 1 }} />
        <select className="inv-zip" defaultValue="" onChange={(e) => { if (e.target.value) { window.location.href = `/api/admin/rechnungen/datei?typ=zip&zeitraum=${e.target.value}`; e.target.value = ''; } }}>
          <option value="">Belegpaket (ZIP) …</option>
          {Array.from({ length: 12 }, (_, k) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - k); const v = d.toISOString().slice(0, 7); return <option key={v} value={v}>{d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</option>; })}
          <option value={year}>Ganzes Jahr {year}</option>
        </select>
        <a className="btn alt sm" href={`/api/admin/rechnungen/datei?typ=csv&jahr=${year}`}>Liste {year} (CSV)</a>
        <button className="btn sm" onClick={create}>+ Neue Rechnung</button>
      </div>
      <div className="box" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="atable inv-table">
          <thead><tr><th>Nr.</th><th>Datum</th><th>Kunde</th><th>Betrag</th><th>Fällig</th><th>Status</th></tr></thead>
          <tbody>
            {shown.map((r) => <tr key={r.id} onClick={() => router.push(`/admin/rechnungen/${r.id}`)}>
              <td><b>{r.no ?? '—'}</b>{r.kind === 'storno' && <span className="muted"> Storno</span>}{r.kind === 'abschlag' && <span className="muted"> Abschlag</span>}{r.inquiryNo && <div className="muted" style={{ fontSize: 12 }}>{r.inquiryNo}</div>}</td>
              <td>{d(r.date)}</td><td>{r.customer}</td><td><b>{eur(r.gross)}</b></td>
              <td>{r.due ? <span className={r.overdue ? 'err' : ''}>{d(r.due)}</span> : '–'}{r.reminders > 0 && <div className="muted" style={{ fontSize: 12 }}>{r.reminders}× erinnert</div>}</td>
              <td><span className={`st st-${CLS[r.status]}`}>{r.kind === 'storno' ? 'Korrektur' : r.overdue ? 'Überfällig' : LABEL[r.status]}</span>{r.no && !r.sent && r.kind === 'rechnung' && <div className="muted" style={{ fontSize: 12 }}>nicht versendet</div>}</td>
            </tr>)}
            {!shown.length && <tr><td colSpan={6} className="muted" style={{ padding: 20 }}>Keine Rechnungen. Rechnungen entstehen am einfachsten aus einer angenommenen Anfrage („Rechnung erstellen“).</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
