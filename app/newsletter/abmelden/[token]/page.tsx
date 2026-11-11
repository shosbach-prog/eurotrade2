import type { Metadata } from 'next';
import { unsubscribe } from '@/lib/newsletter';

export const metadata: Metadata = { title: 'Abgemeldet', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function Unsubscribe({ params }: { params: { token: string } }) {
  const s = unsubscribe(params.token);
  return (
    <div className="gate"><div className="gate-box">
      <h1>{s ? 'Sie sind abgemeldet' : 'Link ungültig'}</h1>
      <p className="muted">{s ? `${s.email} erhält keine Newsletter mehr von uns. Schade – Sie können sich jederzeit wieder anmelden.` : 'Dieser Abmeldelink ist ungültig. Schreiben Sie uns gern an info@euro-trade.com.'}</p>
    </div></div>
  );
}
