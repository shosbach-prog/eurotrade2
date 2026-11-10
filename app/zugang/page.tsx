import type { Metadata } from 'next';
import AccessForm from './AccessForm';

export const metadata: Metadata = { title: 'Zugang', robots: { index: false, follow: false } };

export default function Zugang({ searchParams }: { searchParams: { weiter?: string } }) {
  const next = searchParams.weiter?.startsWith('/') && !searchParams.weiter.startsWith('//') ? searchParams.weiter : '/';
  return (
    <div className="gate">
      <div className="gate-box">
        <div className="gate-lock" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
        </div>
        <h1>Geschlossener Händlershop</h1>
        <p className="muted">Unser Shop steht ausgewählten Kunden, Vereinen und Partnern offen. Bitte geben Sie Ihren persönlichen Zugangscode ein.</p>
        <AccessForm next={next} />
        <p className="gate-foot">Noch keinen Code? Schreiben Sie uns an <a href="mailto:info@euro-trade.com">info@euro-trade.com</a>.</p>
      </div>
    </div>
  );
}
