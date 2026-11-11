import type { Metadata } from 'next';
import QuoteForm from '../start/QuoteForm';
import { getCategories } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Kontakt', description: 'Kontakt zu euro-trade.com – Anfrage für Textilien mit Druck oder Stick, Angebot innerhalb von 24 Stunden.' };

export default function Kontakt({ searchParams }: { searchParams?: { artikel?: string; marke?: string } }) {
  const want = String(searchParams?.artikel ?? searchParams?.marke ?? '').slice(0, 80);
  return (
    <div className="l-section" style={{ marginTop: 24 }}>
      <QuoteForm categories={getCategories().map((c) => c.name)} message={want ? `Ich suche: ${want}` : undefined} aside={<>
        <h2>Kontakt</h2>
        <p>Beschreiben Sie kurz Ihr Vorhaben und schicken Sie Ihr Logo gleich mit. Sie erhalten innerhalb von 24 Stunden ein Angebot.</p>
        <ul><li>Kein Zugangscode nötig</li><li>Logo gleich mitschicken</li><li>Vorschau vor der Produktion</li><li>Unverbindlich und kostenlos</li></ul>
        <p style={{ marginTop: 22 }}><b>Lieber direkt?</b><br />Produktberatung: <a href="tel:+493040719258">030 40719258</a><br />WhatsApp: <a href="https://wa.me/491732648097" target="_blank" rel="noreferrer">Nachricht schreiben</a><br />E-Mail: <a href="mailto:info@euro-trade.com">info@euro-trade.com</a></p>
        <p className="muted" style={{ fontSize: 14 }}>Euro-Trade · Sebastian Hosbach<br />Seehang 28 · 44263 Dortmund</p>
      </>} />
    </div>
  );
}
