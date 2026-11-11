'use client';
import { useState } from 'react';

export default function PasswordForm({ token }: { token: string }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'done'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (token && pw !== pw2) { setErr('Die beiden Passwörter stimmen nicht überein.'); return; }
    setState('busy');
    const r = await fetch('/api/passwort', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token ? { action: 'set', token, password: pw } : { action: 'forgot', email }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error ?? 'Das hat nicht geklappt.'); setState('idle'); return; }
    if (token) { setState('done'); if (d.loggedIn) setTimeout(() => (window.location.href = '/'), 1200); }
    else setState('sent');
  }

  if (state === 'sent') return <p className="ok" style={{ marginTop: 20 }}>✓ Falls ein Zugang mit dieser Adresse existiert, ist die E-Mail unterwegs. Bitte schauen Sie auch im Spam-Ordner nach.</p>;
  if (state === 'done') return <p className="ok" style={{ marginTop: 20 }}>✓ Passwort gespeichert – Sie werden angemeldet …</p>;

  return (
    <form className="gate-form plain" onSubmit={submit}>
      {token ? <>
        <div className="pw-wrap">
          <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Neues Passwort" autoComplete="new-password" minLength={8} required autoFocus aria-label="Neues Passwort" />
          <button type="button" className="pw-eye" onClick={() => setShow(!show)}>{show ? 'verbergen' : 'anzeigen'}</button>
        </div>
        <input type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Passwort wiederholen" autoComplete="new-password" minLength={8} required aria-label="Passwort wiederholen" />
      </> : <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail-Adresse" autoComplete="email" required autoFocus aria-label="E-Mail-Adresse" />}
      <button className="btn" disabled={state === 'busy'}>{state === 'busy' ? 'Einen Moment …' : token ? 'Passwort speichern' : 'Link anfordern'}</button>
      {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
    </form>
  );
}
