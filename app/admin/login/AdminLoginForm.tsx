'use client';
import { useState } from 'react';
export default function AdminLoginForm({ next }: { next: string }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) window.location.href = next; else { setErr(d.error ?? 'Anmeldung fehlgeschlagen.'); setBusy(false); }
  }
  return (
    <form className="gate-form" onSubmit={submit}>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Passwort" autoFocus aria-label="Passwort" style={{ letterSpacing: 1, fontWeight: 400 }} />
      <button className="btn" disabled={busy || !pw}>{busy ? 'Prüfe …' : 'Anmelden'}</button>
      {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
    </form>
  );
}
