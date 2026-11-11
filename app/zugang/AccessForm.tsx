'use client';
import { useState } from 'react';

export default function AccessForm({ next, initialMode = 'mail' }: { next: string; initialMode?: 'mail' | 'code' }) {
  const [mode, setMode] = useState<'mail' | 'code'>(initialMode);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = mode === 'code'
      ? await fetch('/api/zugang', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
      : await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) window.location.href = next;
    else { setErr(d.error ?? 'Anmeldung fehlgeschlagen.'); setBusy(false); }
  }

  return (
    <>
      <div className="login-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'mail'} className={mode === 'mail' ? 'on' : ''} onClick={() => { setMode('mail'); setErr(''); }}>E-Mail & Passwort</button>
        <button type="button" role="tab" aria-selected={mode === 'code'} className={mode === 'code' ? 'on' : ''} onClick={() => { setMode('code'); setErr(''); }}>Zugangscode</button>
      </div>
      {mode === 'mail' ? (
        <form className="gate-form plain" onSubmit={submit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail-Adresse" autoComplete="username" required autoFocus aria-label="E-Mail-Adresse" />
          <div className="pw-wrap">
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" autoComplete="current-password" required aria-label="Passwort" />
            <button type="button" className="pw-eye" onClick={() => setShow(!show)} aria-label={show ? 'Passwort verbergen' : 'Passwort anzeigen'}>{show ? 'verbergen' : 'anzeigen'}</button>
          </div>
          <button className="btn" disabled={busy || !email.trim() || !password}>{busy ? 'Anmelden …' : 'Anmelden'}</button>
          {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
          <a className="pw-forgot" href="/passwort">Passwort vergessen?</a>
        </form>
      ) : (
        <form className="gate-form" onSubmit={submit}>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ZUGANGSCODE" autoComplete="off" autoCapitalize="characters" spellCheck={false} autoFocus aria-label="Zugangscode" />
          <button className="btn" disabled={busy || code.trim().length < 3}>{busy ? 'Prüfe …' : 'Shop öffnen'}</button>
          {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
        </form>
      )}
    </>
  );
}
