import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '100 % Zufriedenheitsgarantie',
  description: 'Die Zufriedenheitsgarantie von euro-trade.com: kostenlose Neuanfertigung bei Veredelungsfehlern, Ersatz bei Mängeln und Umtausch unveredelter Ware – die Bedingungen im Überblick.',
  alternates: { canonical: '/garantie' },
};

export default function Garantie() {
  return (
    <div className="info legal-page">
      <div className="crumbs"><Link href="/">Start</Link> › Zufriedenheitsgarantie</div>
      <h1>100 % Zufriedenheitsgarantie</h1>
      <p className="lead">Wir stehen für jede Bestellung gerade. Wenn etwas nicht so ist, wie wir es zugesagt haben, machen wir es richtig, ohne Diskussion. Das garantieren wir Ihnen:</p>

      <div className="ret-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="box ret"><div className="ret-ico">✦</div><h3>Veredelung wie freigegeben</h3><p>Weicht Druck oder Stick von der von Ihnen freigegebenen Vorschau ab, fertigen wir die betroffenen Teile kostenlos neu oder erstatten den Betrag.</p></div>
        <div className="box ret"><div className="ret-ico">✓</div><h3>Einwandfreie Ware</h3><p>Ist ein Artikel fehlerhaft oder falsch geliefert, ersetzen wir ihn kostenlos, inklusive Hin- und Rückversand.</p></div>
        <div className="box ret"><div className="ret-ico">⇄</div><h3>Umtausch unveredelter Ware</h3><p>Unveredelte Artikel tauschen wir innerhalb von 14 Tagen nach Erhalt in eine andere Größe oder Farbe um, solange verfügbar. Das gilt auch für Firmen und Vereine.</p></div>
      </div>

      <h2>Garantiebedingungen</h2>
      <div className="box legal">
        <p><strong>Garantiegeber:</strong> Sebastian Hosbach, Euro-Trade, Seehang 28, 44263 Dortmund, Telefon 030 40719258, E-Mail info@euro-trade.com.</p>
        <p><strong>Geltungsbereich:</strong> Die Garantie gilt für alle über euro-trade.com angenommenen Angebote, für Verbraucher wie für Unternehmen, Vereine und Behörden.</p>
        <p><strong>1. Veredelung:</strong> Maßgeblich ist die vor der Produktion von Ihnen freigegebene Vorschau. Übliche, produktionsbedingte Toleranzen bei Farbe (z. B. Druck- und Garnfarben gegenüber der Bildschirmdarstellung), Größe (± 5 mm) und Position (± 1 cm) stellen keine Abweichung dar. Nicht umfasst sind Fehler in von Ihnen gelieferten Vorlagen, Texten oder Namenslisten, die in der Vorschau erkennbar waren und freigegeben wurden.</p>
        <p><strong>2. Mängel und Falschlieferung:</strong> Bitte melden Sie offensichtliche Mängel oder Falschlieferungen innerhalb von 7 Tagen nach Erhalt mit Fotos an info@euro-trade.com.</p>
        <p><strong>3. Umtausch:</strong> Der Umtausch gilt für ungetragene, ungewaschene Ware ohne Gebrauchsspuren in der Originalverpackung. Die Kosten der Rücksendung tragen Sie; den Versand der Ersatzware übernehmen wir. Veredelte Artikel sind vom Umtausch ausgeschlossen, da sie individuell für Sie gefertigt werden.</p>
        <p><strong>4. Abwicklung:</strong> Schreiben Sie uns mit Ihrer Auftragsnummer. Wir melden uns innerhalb von zwei Werktagen mit einer Lösung.</p>
        <p><strong>Ihre gesetzlichen Rechte</strong> (insbesondere Gewährleistung und, für Verbraucher, das <Link href="/widerruf" className="alink">Widerrufsrecht</Link>) bestehen unabhängig von dieser Garantie und werden durch sie nicht eingeschränkt. Die Inanspruchnahme der Garantie ist unentgeltlich.</p>
      </div>

      <div className="box l-cta-box">
        <div><h2 style={{ margin: 0 }}>Etwas stimmt nicht?</h2><p className="muted" style={{ margin: '4px 0 0' }}>Schreiben Sie uns, wir kümmern uns sofort.</p></div>
        <a href="mailto:info@euro-trade.com" className="btn" style={{ display: 'inline-grid', placeItems: 'center' }}>info@euro-trade.com</a>
      </div>
    </div>
  );
}
