import type { Metadata } from 'next';
import PasswordForm from './PasswordForm';

export const metadata: Metadata = { title: 'Passwort', robots: { index: false, follow: false } };

export default function Passwort({ searchParams }: { searchParams: { t?: string } }) {
  const token = searchParams.t ?? '';
  return (
    <div className="gate">
      <div className="gate-box">
        <div className="gate-lock" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2 20 3M17 6l3 3M15 8l2 2" /></svg>
        </div>
        <h1>{token ? 'Passwort festlegen' : 'Passwort vergessen?'}</h1>
        <p className="muted">{token ? 'Wählen Sie Ihr Passwort (mindestens 8 Zeichen). Danach sind Sie direkt angemeldet.' : 'Geben Sie Ihre E-Mail-Adresse ein. Wir schicken Ihnen einen Link, mit dem Sie ein neues Passwort festlegen.'}</p>
        <PasswordForm token={token} />
        <p className="gate-foot"><a href="/zugang">Zurück zur Anmeldung</a></p>
      </div>
    </div>
  );
}
