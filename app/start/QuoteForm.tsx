'use client';
import { useState } from 'react';
import Link from 'next/link';

/** Preisanfrage ohne Zugangscode: Artikelart, Menge, Logo, Muster */
export default function QuoteForm({ categories }: { categories: string[] }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState('');
  const [file, setFile] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState('busy'); setErr('');
    const r = await fetch('/api/preisanfrage', { method: 'POST', body: new FormData(e.currentTarget) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setState('done'); else { setErr(d.error ?? 'Senden fehlgeschlagen.'); setState('idle'); }
  }
  if (state === 'done') return <div className="box qf-done"><span className="qf-ok">✓</span><h3>Vielen Dank!</h3><p>Ihre Anfrage ist da. Wir melden uns innerhalb von 24 Stunden mit Ihrem Angebot – eine Bestätigung haben wir Ihnen per E-Mail geschickt.</p></div>;
  return (
    <form className="box form qf" onSubmit={submit}>
      <div className="two">
        <div><label>Was brauchen Sie?</label>
          <select name="category" className="sel">{['Weiß ich noch nicht – bitte beraten', ...categories].map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label>Menge ca.</label><input name="qty" inputMode="numeric" placeholder="z. B. 25" /></div>
      </div>
      <div className="two">
        <div><label>Veredelung</label>
          <select name="deco" className="sel">{['Beratung gewünscht', 'Druck', 'Stick', 'Ohne Veredelung'].map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label>Ihr Logo <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <label className="qf-file"><input type="file" name="logo" hidden accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.eps" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />{file ? `📎 ${file}` : 'Datei wählen (PNG, JPG, PDF, AI, EPS)'}</label></div>
      </div>
      <div className="two">
        <div><label>Name *</label><input name="name" required autoComplete="name" /></div>
        <div><label>Verein / Firma</label><input name="company" autoComplete="organization" /></div>
      </div>
      <div className="two">
        <div><label>E-Mail *</label><input name="email" type="email" required autoComplete="email" /></div>
        <div><label>Telefon</label><input name="phone" type="tel" autoComplete="tel" /></div>
      </div>
      <label>Nachricht</label>
      <textarea name="message" placeholder="Farben, Größen, Termin, Namen und Nummern …" style={{ minHeight: 80 }} />
      <label className="qf-check"><input type="checkbox" name="sample" /> <span><b>Muster gewünscht</b> – wir schicken Ihnen vorab ein Musterteil zur Ansicht.</span></label>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="qf-check"><input type="checkbox" name="privacy" required /> <span>Ich stimme der Verarbeitung meiner Daten gemäß <Link href="/datenschutz" style={{ textDecoration: 'underline' }}>Datenschutzerklärung</Link> zu. *</span></label>
      <button className="btn" disabled={state === 'busy'}>{state === 'busy' ? 'Wird gesendet …' : 'Unverbindliches Angebot anfordern'}</button>
      {err && <div className="note err">{err}</div>}
    </form>
  );
}
