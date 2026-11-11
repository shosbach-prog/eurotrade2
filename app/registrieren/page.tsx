import type { Metadata } from 'next';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = { title: 'Registrieren', description: 'Kundenkonto bei euro-trade.com anlegen – Markentextilien ab 1 Stück, mit Druck oder Stick.', robots: { index: false, follow: true } };

export default function Registrieren() {
  return (
    <div className="gate">
      <div className="gate-box reg-box">
        <div className="gate-lock" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
        </div>
        <h1>Konto anlegen</h1>
        <p className="muted">Nach der Registrierung prüfen wir Ihre Angaben und schalten Ihr Konto in der Regel innerhalb von 24 Stunden frei. Danach sehen Sie Ihre Preise und können bestellen.</p>
        <RegisterForm />
        <p className="gate-foot">Schon ein Konto? <a href="/zugang">Anmelden</a></p>
      </div>
    </div>
  );
}
