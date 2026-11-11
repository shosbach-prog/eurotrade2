import type { Metadata } from 'next';
import AccessForm from './AccessForm';

export const metadata: Metadata = { title: 'Anmelden', description: 'Anmeldung für Kunden von euro-trade.com mit E-Mail und Passwort oder persönlichem Zugangscode.', robots: { index: false, follow: false } };

export default function Zugang({ searchParams }: { searchParams: { weiter?: string; code?: string; abgemeldet?: string } }) {
  const next = searchParams.weiter?.startsWith('/') && !searchParams.weiter.startsWith('//') ? searchParams.weiter : '/';
  return (
    <div className="gate">
      <div className="gate-box">
        <div className="gate-lock" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
        </div>
        {searchParams.abgemeldet != null && <p className="logout-ok">✓ Sie wurden abgemeldet.</p>}
        <h1>Anmelden</h1>
        <p className="muted">Unser Shop steht ausgewählten Kunden, Vereinen und Partnern offen. Melden Sie sich mit E-Mail und Passwort oder Ihrem persönlichen Zugangscode an.</p>
        <AccessForm next={next} initialMode={searchParams.code != null ? 'code' : 'mail'} />
        <p className="gate-foot">Noch kein Konto? <a href="/registrieren">Jetzt registrieren</a></p>
      </div>
    </div>
  );
}
