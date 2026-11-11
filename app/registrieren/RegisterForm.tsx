'use client';
import { useState } from 'react';
import Link from 'next/link';

const TYPES = ['Unternehmen', 'Verein', 'Handwerk', 'Gastronomie / Hotel', 'Schule / Kita', 'Event / Agentur', 'Privat', 'Sonstiges'];

export default function RegisterForm() {
  const [v, setV] = useState<Record<string, string>>({ type: '' });
  const [show, setShow] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((o) => ({ ...o, [k]: e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? (e.target.checked ? 'on' : '') : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (v.password !== v.password2) { setErr('Die beiden Passwörter stimmen nicht überein.'); return; }
    setState('busy'); setErr('');
    const r = await fetch('/api/registrieren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...v, privacy: v.privacy === 'on' }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setState('done'); else { setErr(d.error ?? 'Registrierung fehlgeschlagen.'); setState('idle'); }
  }

  if (state === 'done') return (
    <div className="reg-done"><span className="qf-ok">✓</span><h3>Fast geschafft!</h3>
      <p>Ihr Konto ist angelegt. Wir schalten es in der Regel innerhalb von 24 Stunden frei und schicken Ihnen dann eine E-Mail an <b>{v.email}</b>.</p></div>
  );

  return (
    <form className="form reg-form" onSubmit={submit}>
      <div className="two">
        <div><label>Vorname *</label><input value={v.first ?? ''} onChange={set('first')} required autoComplete="given-name" /></div>
        <div><label>Nachname *</label><input value={v.last ?? ''} onChange={set('last')} required autoComplete="family-name" /></div>
      </div>
      <label>Unternehmen / Verein</label><input value={v.company ?? ''} onChange={set('company')} autoComplete="organization" placeholder="optional" />
      <div className="two">
        <div><label>E-Mail *</label><input type="email" value={v.email ?? ''} onChange={set('email')} required autoComplete="email" /></div>
        <div><label>Telefon</label><input type="tel" value={v.phone ?? ''} onChange={set('phone')} autoComplete="tel" placeholder="optional" /></div>
      </div>
      <label>Wir sind …</label>
      <select className="sel" value={v.type} onChange={set('type')}><option value="">Bitte wählen</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      <div className="two">
        <div><label>Passwort * <span className="muted" style={{ fontWeight: 400 }}>(mind. 8 Zeichen)</span></label><input type={show ? 'text' : 'password'} value={v.password ?? ''} onChange={set('password')} required minLength={8} autoComplete="new-password" /></div>
        <div><label>Passwort wiederholen *</label><input type={show ? 'text' : 'password'} value={v.password2 ?? ''} onChange={set('password2')} required minLength={8} autoComplete="new-password" /></div>
      </div>
      <label className="qf-check" style={{ marginTop: 8 }}><input type="checkbox" checked={show} onChange={() => setShow(!show)} /> <span>Passwort anzeigen</span></label>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" onChange={set('website')} />
      <label className="qf-check"><input type="checkbox" checked={v.privacy === 'on'} onChange={set('privacy')} required /> <span>Ich stimme der Verarbeitung meiner Daten gemäß <Link href="/datenschutz" style={{ textDecoration: 'underline' }}>Datenschutzerklärung</Link> zu. *</span></label>
      <button className="btn" disabled={state === 'busy'} style={{ width: '100%', marginTop: 14 }}>{state === 'busy' ? 'Wird angelegt …' : 'Konto anlegen'}</button>
      {err && <div className="note err">{err}</div>}
    </form>
  );
}
