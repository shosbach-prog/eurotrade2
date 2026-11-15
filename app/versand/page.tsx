import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Versand & Lieferung',
  description: 'Versandkosten, Lieferzeiten und Zahlungsarten bei euro-trade.com – Versand innerhalb Deutschlands pauschal 4,90 € je Bestellung.',
  alternates: { canonical: '/versand' },
};

/** Versandkosten pauschal brutto (Deutschland) – identisch mit dem Google-Feed (SHIPPING_GROSS) */
const SHIPPING = Number(process.env.SHIPPING_GROSS ?? 4.9);
const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

export default function Versand() {
  return (
    <div className="info legal-page">
      <div className="crumbs"><Link href="/">Startseite</Link> › Versand & Lieferung</div>
      <h1>Versand & Lieferung</h1>
      <p className="lead">Versand innerhalb Deutschlands: pauschal <strong>{eur(SHIPPING)}</strong> je Bestellung (inkl. MwSt.) – unabhängig von Menge und Gewicht.</p>

      <h2>Versandkosten</h2>
      <table className="atable">
        <thead><tr><th>Lieferland</th><th>Versandkosten</th></tr></thead>
        <tbody>
          <tr><td>Deutschland</td><td>{eur(SHIPPING)} je Bestellung (inkl. MwSt.)</td></tr>
          <tr><td>Andere Länder</td><td>auf Anfrage – die Kosten nennen wir im Angebot</td></tr>
        </tbody>
      </table>

      <h2>Lieferzeit</h2>
      <p>Die voraussichtliche Lieferzeit nennen wir im Angebot bzw. in der Bestellbestätigung. Bedruckte oder bestickte Artikel werden nach Ihrer Freigabe der Vorschau gefertigt – Lieferung meist in 7–14 Werktagen.</p>

      <h2>Zahlung</h2>
      <p>Zahlung per Vorkasse (Überweisung). Unternehmen, Vereine und öffentliche Einrichtungen können nach Vereinbarung auf Rechnung bestellen. Details: <Link href="/agb">AGB</Link>.</p>

      <h2>Rückgabe</h2>
      <p>Unveredelte Ware können Verbraucher innerhalb von 14 Tagen zurückgeben. Alles dazu unter <Link href="/widerruf">Rückgabe & Widerruf</Link>.</p>
    </div>
  );
}
