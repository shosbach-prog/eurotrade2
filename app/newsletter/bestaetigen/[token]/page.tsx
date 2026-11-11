import Link from 'next/link';
import type { Metadata } from 'next';
import { confirm, tierText } from '@/lib/newsletter';

export const metadata: Metadata = { title: 'Anmeldung bestätigt', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Confirm({ params }: { params: { token: string } }) {
  const s = await confirm(params.token);
  return (
    <div className="gate"><div className="gate-box" style={{ maxWidth: 520 }}>
      {s ? <>
        <div className="gate-lock" style={{ background: '#e6f6ec', color: 'var(--ok)' }} aria-hidden>✓</div>
        <h1>Anmeldung bestätigt!</h1>
        <p className="muted">Ihr persönlicher Rabattcode für die erste Bestellung:</p>
        <div className="nl-code">{s.code}</div>
        <p className="muted" style={{ fontSize: 14 }}>{tierText()} – wir haben Ihnen den Code auch per E-Mail geschickt.</p>
        <Link href="/" className="btn" style={{ display: 'inline-grid', placeItems: 'center', marginTop: 8 }}>Zum Shop</Link>
      </> : <>
        <h1>Link ungültig</h1>
        <p className="muted">Dieser Bestätigungslink ist abgelaufen oder ungültig. Melden Sie sich einfach erneut auf der Startseite an.</p>
        <Link href="/#newsletter" className="btn" style={{ display: 'inline-grid', placeItems: 'center' }}>Zur Anmeldung</Link>
      </>}
    </div></div>
  );
}
