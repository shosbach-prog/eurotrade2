import type { Metadata } from 'next';
import QuoteForm from '../start/QuoteForm';
import { getCategories } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Kontakt', description: 'Kontakt zu euro-trade.com – Anfrage für Textilien mit Druck oder Stick, Angebot innerhalb von 24 Stunden.' };

export default function Kontakt() {
  return (
    <div className="l-section" style={{ marginTop: 24 }}>
      <QuoteForm categories={getCategories().map((c) => c.name)} aside={<>
        <h2>Kontakt</h2>
        <p>Beschreiben Sie kurz Ihr Vorhaben und schicken Sie Ihr Logo gleich mit. Sie erhalten innerhalb von 24 Stunden ein Angebot.</p>
        <ul><li>Kein Zugangscode nötig</li><li>Logo gleich mitschicken</li><li>Auf Wunsch vorab ein Muster</li><li>Unverbindlich und kostenlos</li></ul>
        <p style={{ marginTop: 22 }}><b>Lieber direkt?</b><br />Telefon / WhatsApp: <a href="tel:+491732648097">0173 2648097</a><br />E-Mail: <a href="mailto:info@euro-trade.com">info@euro-trade.com</a></p>
        <p className="muted" style={{ fontSize: 14 }}>Euro-Trade · Sebastian Hosbach<br />Seehan 28 · 44263 Dortmund</p>
      </>} />
    </div>
  );
}
