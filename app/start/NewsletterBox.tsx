'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function NewsletterBox({ tiers }: { tiers: { pct: number; min: number }[] }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'already'>('idle');
  const [err, setErr] = useState('');
  const max = Math.max(...tiers.map((t) => t.pct));
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState('busy'); setErr('');
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setState(d.already ? 'already' : 'done'); else { setErr(d.error ?? 'Anmeldung fehlgeschlagen.'); setState('idle'); }
  }
  return (
    <section id="newsletter" className="nl">
      <div className="nl-text">
        <h2>Bis zu {max} % Rabatt<br />auf Ihre erste Bestellung.</h2>
        <ul className="nl-tiers">
          {tiers.map((t, n) => <li key={t.pct} className={n === tiers.length - 1 ? 'top' : ''}><span className="nl-pct">{t.pct} %</span> ab {t.min.toLocaleString('de-DE')} € Warenwert{n === tiers.length - 1 && <span className="nl-hot">beliebt</span>}</li>)}
        </ul>
      </div>
      {state === 'done' ? (
        <div className="nl-done">
          <strong>Fast geschafft – bitte prüfen Sie Ihr Postfach.</strong>
          <p>Wir haben Ihnen eine E-Mail mit einem Bestätigungslink geschickt. Erst nach dem Klick erhalten Sie Ihren Rabattcode. <b>Bitte schauen Sie auch im Spam-Ordner nach.</b></p>
        </div>
      ) : state === 'already' ? (
        <div className="nl-done"><strong>Sie sind bereits angemeldet.</strong><p>Ihren Rabattcode finden Sie in unserer Willkommens-E-Mail.</p></div>
      ) : (
        <form className="nl-form" onSubmit={submit}>
          <div className="nl-row">
            <input name="email" type="email" required placeholder="E-Mail eintragen" aria-label="E-Mail-Adresse" autoComplete="email" />
            <button className="btn nl-btn" disabled={state === 'busy'}>{state === 'busy' ? 'Sende …' : 'Anmelden und sparen'}</button>
          </div>
          <select name="type" aria-label="Wir sind" defaultValue="">
            <option value="" disabled>Wir sind … (optional)</option>
            {['Verein', 'Unternehmen', 'Handwerk', 'Gastronomie / Hotel', 'Schule / Kita', 'Event / Agentur', 'Privat'].map((x) => <option key={x}>{x}</option>)}
          </select>
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <label className="nl-priv"><input type="checkbox" name="privacy" required /> <span>Ich möchte den Newsletter mit Angeboten und Neuheiten erhalten und akzeptiere die <Link href="/datenschutz#newsletter">Datenschutzerklärung</Link>. Abmeldung jederzeit möglich.</span></label>
          <p className="nl-hint">☝️ <b>Wichtig:</b> Im Anschluss erhalten Sie eine E-Mail mit einem Link, um Ihre Anmeldung zu bestätigen. Bitte schauen Sie auch im Spam-Ordner nach.</p>
          {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
          <p className="nl-small">Gültig nur für Neukunden · einmalig einlösbar · auf den Netto-Warenwert der Textilien</p>
        </form>
      )}
    </section>
  );
}
