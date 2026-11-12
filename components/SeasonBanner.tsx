import Link from 'next/link';
import { LEAD, fmtDate, subWorkdays } from '@/lib/leadtime';

/** Saison-Hinweis auf der Startseite (1. Okt. – 20. Dez.): Weihnachtsgeschenke mit Freigabe-Stichtag */
export default function SeasonBanner() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 9, 1), end = new Date(now.getFullYear(), 11, 20);
  if (now < start || now > end) return null;
  const xmas = new Date(now.getFullYear(), 11, 23);
  const approve = subWorkdays(xmas, LEAD.deco + LEAD.ship);
  const days = Math.max(0, Math.ceil((approve.getTime() - now.getTime()) / 864e5));
  return (
    <Link href="/aktion/weihnachtsgeschenke-mitarbeiter" className="season">
      <span className="season-ic" aria-hidden>🎁</span>
      <span className="season-t"><b>Weihnachtsgeschenke mit Ihrem Logo</b><span>Decken, Mützen, Schirme, Plüsch & mehr – für Team und Kunden. {days > 0 ? <>Vorschau bis <b>{fmtDate(approve)}</b> freigeben ({days} Tage) für Lieferung vor Weihnachten.</> : 'Jetzt anfragen – wir prüfen, was noch möglich ist.'}</span></span>
      <span className="season-go">Geschenkideen ansehen →</span>
    </Link>
  );
}
