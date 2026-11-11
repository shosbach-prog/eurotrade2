import Stars from './Stars';
import type { Review } from '@/lib/store';

const SRC = { formular: '', email: 'per E-Mail übermittelt', telefon: 'telefonisch übermittelt', persoenlich: 'persönlich übermittelt' } as const;
const d = (x: string) => new Date(x).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

export function ReviewCard({ r, showProduct }: { r: Review; showProduct?: boolean }) {
  return (
    <figure className="rev">
      <div className="rev-top"><Stars value={r.rating} size={15} /><span className="rev-ver">✓ Verifizierter Kauf{r.source && r.source !== 'formular' ? ` · ${SRC[r.source]}` : ''}</span></div>
      {r.incentive && <span className="rev-inc">{r.incentive}</span>}
      {r.title && <b className="rev-title">{r.title}</b>}
      {r.text && <blockquote>{r.text}</blockquote>}
      <figcaption>{r.name}{r.company ? ` · ${r.company}` : ''} · {d(r.date)}{showProduct && r.productName && <> · <span className="muted">{r.productName}</span></>}</figcaption>
      {r.reply && <div className="rev-reply"><b>Antwort von euro-trade.com:</b> {r.reply}</div>}
    </figure>
  );
}

/** Hinweis nach § 5b Abs. 3 UWG: ob und wie die Echtheit geprüft wird */
export const ReviewNote = () => <p className="rev-note">Alle Bewertungen stammen von Kundinnen und Kunden, die bei uns bestellt haben. Wir laden ausschließlich nach abgeschlossenem Auftrag über einen persönlichen Link zur Bewertung ein (verifiziert über die Auftragsnummer). Per E-Mail, telefonisch oder persönlich erhaltene Bewertungen tragen wir nur mit Zustimmung der Kundin bzw. des Kunden und mit Bezug zu einem tatsächlichen Auftrag ein und kennzeichnen sie entsprechend. Bewertungen, für die eine Gegenleistung gewährt wurde (z. B. ein kostenloses Testprodukt), sind als solche gekennzeichnet. Bewertungen werden vor Veröffentlichung geprüft; positive wie negative werden gleichermaßen veröffentlicht, sofern sie nicht gegen gesetzliche Vorgaben verstoßen.</p>;
