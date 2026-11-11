'use client';
import { useState } from 'react';

type P = { code: string; name: string; email?: string | null; note?: string; createdAt?: string };

/** Neue Registrierungen: mit einem Klick freischalten oder ablehnen */
export default function PendingBox({ items }: { items: P[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  if (!items.length) return null;

  async function act(c: P, action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm(`Registrierung von ${c.name} ablehnen und löschen?`)) return;
    setBusy(c.code + action); setMsg(null);
    const r = await fetch('/api/admin/kunden/freigabe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c.code, action }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setBusy(null); setMsg({ ok: false, t: d.error ?? 'Fehler' }); return; }
    window.location.reload();
  }

  return (
    <div className="pending-box">
      <div className="pending-head"><span className="admin-alert-dot">{items.length}</span><strong>{items.length === 1 ? 'Neue Registrierung' : 'Neue Registrierungen'} – warten auf Freigabe</strong></div>
      {msg && <p className={msg.ok ? 'ok' : 'err'} style={{ margin: '0 0 10px' }}>{msg.t}</p>}
      {items.map((c) => (
        <div key={c.code} className="pending-row">
          <div className="pending-info">
            <b>{c.name}</b>
            {c.email && <a className="alink" href={`mailto:${c.email}`}>{c.email}</a>}
            {c.note && <span className="muted">{c.note.replace(/^Selbst registriert [^·]*· /, '')}</span>}
            {c.createdAt && <span className="muted" style={{ fontSize: 12 }}>registriert am {new Date(c.createdAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
          <div className="pending-actions">
            <button className="btn btn-approve" disabled={!!busy} onClick={() => act(c, 'approve')}>{busy === c.code + 'approve' ? 'Schalte frei …' : '✓ Freischalten'}</button>
            <button className="btn alt" disabled={!!busy} onClick={() => act(c, 'reject')}>Ablehnen</button>
          </div>
        </div>
      ))}
      <p className="muted" style={{ margin: '10px 0 0', fontSize: 13 }}>Beim Freischalten bekommt der Kunde automatisch eine E-Mail (sofern SMTP eingerichtet ist) und kann sich sofort anmelden. Aufschlag, Kollektion und Logo stellen Sie danach unten beim Kunden ein.</p>
    </div>
  );
}
