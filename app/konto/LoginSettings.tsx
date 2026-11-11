'use client';
import { useEffect, useState } from 'react';

/** Kunde legt im Konto E-Mail + Passwort fest – danach Anmeldung ohne Code möglich */
export default function LoginSettings() {
  const [info, setInfo] = useState<{ email: string; hasPw: boolean; editable: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [current, setCurrent] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch('/api/konto/login').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) { setInfo(d); setEmail(d.email); } }).catch(() => {}); }, []);
  if (!info?.editable) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await fetch('/api/konto/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, current, password: pw }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setInfo({ ...info!, email: email.trim().toLowerCase(), hasPw: true }); setOpen(false); setCurrent(''); setPw(''); setMsg({ ok: true, t: 'Gespeichert – Sie können sich jetzt mit E-Mail und Passwort anmelden.' }); }
    else setMsg({ ok: false, t: d.error ?? 'Speichern fehlgeschlagen.' });
  }

  return (
    <div className="box konto-login" id="anmeldung">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>Anmeldung</strong>
        <span className="muted" style={{ fontSize: 14 }}>{info.hasPw ? `E-Mail & Passwort aktiv (${info.email})` : 'Bisher nur mit Zugangscode – legen Sie E-Mail und Passwort fest.'}</span>
        <button type="button" className="btn alt" style={{ height: 36, marginLeft: 'auto' }} onClick={() => setOpen(!open)}>{info.hasPw ? 'Ändern' : 'Passwort festlegen'}</button>
      </div>
      {msg && <p className={msg.ok ? 'ok' : 'err'} style={{ margin: '10px 0 0', fontSize: 14 }}>{msg.t}</p>}
      {open && (
        <form className="form" onSubmit={save}>
          <label>E-Mail-Adresse</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          {info.hasPw && <><label>Aktuelles Passwort</label><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required /></>}
          <label>{info.hasPw ? 'Neues Passwort' : 'Passwort'} (mind. 8 Zeichen)</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={8} required />
          <button className="btn" disabled={busy} style={{ marginTop: 14 }}>{busy ? 'Speichert …' : 'Speichern'}</button>
        </form>
      )}
    </div>
  );
}
