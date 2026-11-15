'use client';
import { useState } from 'react';

type K = { id: string; name: string; prefix: string; created: string; lastUsed?: string | null };
const d = (s?: string | null) => (s ? new Date(s).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '–');

/** API-Schlüssel für die Shop-API anlegen und widerrufen */
export default function ApiKeys({ initial }: { initial: K[] }) {
  const [keys, setKeys] = useState(initial);
  const [name, setName] = useState('');
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reload = async () => setKeys((await fetch('/api/admin/api-keys').then((r) => r.json())).keys ?? []);
  const create = async () => {
    setBusy(true);
    const r = await fetch('/api/admin/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).then((x) => x.json());
    setBusy(false);
    if (r.key) { setFresh(r.key); setName(''); reload(); }
  };
  const revoke = async (k: K) => {
    if (!confirm(`Schlüssel „${k.name}“ widerrufen? Programme, die ihn nutzen, haben danach keinen Zugriff mehr.`)) return;
    await fetch(`/api/admin/api-keys?id=${k.id}`, { method: 'DELETE' });
    reload();
  };
  return (
    <div>
      <p className="muted">Mit einem Schlüssel können Programme Artikel über die Shop-API anlegen, ändern und löschen (<code>/api/v1/artikel</code>). Neue Artikel sind standardmäßig ausgeblendet (Entwurf).</p>
      {fresh && (
        <div className="box" style={{ background: '#fff8e1', margin: '10px 0' }}>
          <strong>Neuer Schlüssel – jetzt kopieren, er wird nur einmal angezeigt:</strong>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input readOnly value={fresh} style={{ flex: 1, fontFamily: 'monospace' }} onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="btn" onClick={() => navigator.clipboard?.writeText(fresh)}>Kopieren</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, margin: '10px 0' }}>
        <input placeholder="Name, z. B. „Import-Skript“" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }} />
        <button type="button" className="btn" disabled={busy} onClick={create}>Schlüssel anlegen</button>
      </div>
      {keys.length ? (
        <table className="atable">
          <thead><tr><th>Name</th><th>Schlüssel</th><th>Angelegt</th><th>Zuletzt genutzt</th><th /></tr></thead>
          <tbody>{keys.map((k) => <tr key={k.id}><td>{k.name}</td><td><code>{k.prefix}…</code></td><td>{d(k.created)}</td><td>{d(k.lastUsed)}</td><td><button type="button" className="btn sm alt" onClick={() => revoke(k)}>Widerrufen</button></td></tr>)}</tbody>
        </table>
      ) : <p className="muted">Noch kein Schlüssel angelegt.</p>}
    </div>
  );
}
