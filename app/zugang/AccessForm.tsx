'use client';
import { useState } from 'react';

export default function AccessForm({ next }: { next: string }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await fetch('/api/zugang', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) window.location.href = next;
    else { setErr(d.error ?? 'Anmeldung fehlgeschlagen.'); setBusy(false); }
  }

  return (
    <form className="gate-form" onSubmit={submit}>
      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ZUGANGSCODE" autoComplete="off" autoCapitalize="characters" spellCheck={false} autoFocus aria-label="Zugangscode" />
      <button className="btn" disabled={busy || code.trim().length < 3}>{busy ? 'Prüfe …' : 'Shop öffnen'}</button>
      {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
    </form>
  );
}
