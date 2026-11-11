import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import { listSubscribers } from '@/lib/store';
import { tierText } from '@/lib/newsletter';

export const metadata: Metadata = { title: 'Newsletter', robots: { index: false, follow: false } };
const d = (x?: string | null) => (x ? new Date(x).toLocaleDateString('de-DE') : '–');

export default function Newsletter() {
  const all = listSubscribers().slice().reverse();
  const active = all.filter((s) => s.confirmed && !s.unsubscribedAt);
  return (
    <>
      <AdminNav active="newsletter" />
      <div className="list-head">
        <h1 style={{ marginBottom: 0 }}>Newsletter</h1>
        <a className="btn alt" href="/api/admin/newsletter" style={{ display: 'inline-grid', placeItems: 'center' }}>CSV exportieren ({active.length} aktiv)</a>
      </div>
      <p className="muted">Willkommensrabatt: {tierText()} · Anpassen über <code>NEWSLETTER_TIERS</code> in der .env.</p>
      <div className="chips" style={{ margin: '0 0 14px' }}>
        <span className="chip">Bestätigt: <b>{active.length}</b></span>
        <span className="chip">Unbestätigt: <b>{all.filter((s) => !s.confirmed).length}</b></span>
        <span className="chip">Abgemeldet: <b>{all.filter((s) => s.unsubscribedAt).length}</b></span>
        <span className="chip">Codes eingelöst: <b>{all.filter((s) => s.usedAt).length}</b></span>
      </div>
      {!all.length ? <div className="box muted">Noch keine Anmeldungen.</div> : (
        <div className="box" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="atable">
            <thead><tr><th>E-Mail</th><th>Typ</th><th>Angemeldet</th><th>Status</th><th>Code</th><th>Eingelöst</th></tr></thead>
            <tbody>{all.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td><td className="muted">{s.type || '–'}</td><td>{d(s.date)}</td>
                <td>{s.unsubscribedAt ? <span className="st st-abgelehnt">abgemeldet</span> : s.confirmed ? <span className="st st-angenommen">bestätigt</span> : <span className="st st-neu">unbestätigt</span>}</td>
                <td><code>{s.code ?? '–'}</code></td><td>{s.usedAt ? `${d(s.usedAt)} · ${s.usedIn}` : '–'}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
