'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RequestForm() {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState('busy'); setErr('');
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch('/api/zugang-anfrage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setState('done'); else { setErr(d.error ?? 'Senden fehlgeschlagen.'); setState('idle'); }
  }
  if (state === 'done') return <div className="box"><h3 style={{ marginTop: 0 }}>Vielen Dank!</h3><p style={{ margin: 0 }}>Wir melden uns innerhalb von 24 Stunden mit Ihrem Zugangscode.</p></div>;
  return (
    <form className="box form" onSubmit={submit}>
      <div className="two">
        <div><label>Name *</label><input name="name" required /></div>
        <div><label>Verein / Firma</label><input name="company" /></div>
      </div>
      <div className="two">
        <div><label>E-Mail *</label><input name="email" type="email" required /></div>
        <div><label>Telefon</label><input name="phone" type="tel" /></div>
      </div>
      <label>Wir sind …</label>
      <select name="type" className="sel">
        {['Verein', 'Unternehmen', 'Handwerk', 'Gastronomie / Hotel', 'Schule / Kita', 'Event / Agentur', 'Sonstiges'].map((x) => <option key={x}>{x}</option>)}
      </select>
      <label>Was planen Sie?</label>
      <textarea name="message" placeholder="z. B. 40 Hoodies mit Vereinslogo, Polos für das Team …" />
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}>
        <input type="checkbox" name="privacy" required style={{ width: 'auto' }} />
        <span>Ich stimme der Verarbeitung meiner Daten gemäß <Link href="/datenschutz" style={{ textDecoration: 'underline' }}>Datenschutzerklärung</Link> zu. *</span>
      </label>
      <button className="btn" disabled={state === 'busy'}>{state === 'busy' ? 'Wird gesendet …' : 'Zugang anfragen'}</button>
      {err && <div className="note err">{err}</div>}
    </form>
  );
}
