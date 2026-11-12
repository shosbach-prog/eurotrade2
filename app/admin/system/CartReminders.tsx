'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CartRow } from '@/lib/cart-remind';

const ST: Record<string, string> = { wartet: 'wartet', freigegeben: 'freigegeben', erinnert: 'erinnert ✓', angefragt: 'angefragt ✓', abgemeldet: 'abgemeldet', verworfen: 'verworfen' };

/** Gemerkte Warenkörbe mit Einwilligung – freigeben, sofort senden oder verwerfen */
export default function CartReminders({ rows, approve }: { rows: CartRow[]; approve: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const act = async (id: string, action: 'approve' | 'send' | 'drop') => {
    setBusy(id + action); setMsg('');
    const r = await fetch('/api/admin/warenkorb', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
    const d = await r.json().catch(() => ({}));
    setBusy(''); if (!r.ok) setMsg(d.error ?? 'Fehler'); else router.refresh();
  };
  if (!rows.length) return <p className="muted">Keine gemerkten Warenkörbe in den letzten 30 Tagen.</p>;
  return (
    <>
      {msg && <p className="sys-warn">{msg}</p>}
      <div className="cr-list">
        {rows.map((r) => {
          const open = r.status === 'wartet' || r.status === 'freigegeben';
          return (
            <div key={r.id} className={`cr-row ${open ? '' : 'done'}`}>
              <div><b>{r.name || r.email}</b>{r.name && <span className="muted"> · {r.email}</span>}<br />
                <small className="muted">{r.count} Teile · {new Date(r.updatedAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })} · <a className="alink" href={`/warenkorb?teilen=${r.shareId}`} target="_blank" rel="noreferrer">Warenkorb ansehen</a></small></div>
              <span className={`cr-st ${r.status}`}>{ST[r.status] ?? r.status}{open && r.due && ' · fällig'}</span>
              {open && <span className="cr-act">
                {approve && !r.approved && <button type="button" className="btn sm alt" disabled={!!busy} onClick={() => act(r.id, 'approve')}>Freigeben</button>}
                <button type="button" className="btn sm" disabled={!!busy} onClick={() => act(r.id, 'send')}>{busy === r.id + 'send' ? 'Sende …' : 'Jetzt senden'}</button>
                <button type="button" className="linkbtn" disabled={!!busy} onClick={() => act(r.id, 'drop')}>Verwerfen</button>
              </span>}
            </div>
          );
        })}
      </div>
    </>
  );
}
