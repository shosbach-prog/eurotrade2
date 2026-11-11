import Link from 'next/link';
/** Siegel unten links – verlinkt auf die Garantiebedingungen (eigene Garantie, kein fremdes Gütesiegel) */
export default function TrustBadge() {
  return (
    <Link href="/garantie" className="tbadge" aria-label="100 % Zufriedenheitsgarantie – Bedingungen ansehen">
      <svg viewBox="0 0 100 100" width="92" height="92" aria-hidden>
        <defs>
          <linearGradient id="tb-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe45c" /><stop offset="1" stopColor="#ffb300" /></linearGradient>
          <path id="tb-top" d="M 16 50 A 34 34 0 0 1 84 50" />
          <path id="tb-bot" d="M 12 50 A 38 38 0 0 0 88 50" />
        </defs>
        <circle cx="50" cy="50" r="48" fill="#0646c9" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="url(#tb-g)" strokeWidth="2" strokeDasharray="2 3" />
        <circle cx="50" cy="50" r="27" fill="url(#tb-g)" />
        <text fontSize="8.2" fontWeight="800" fill="#fff" letterSpacing="1.4"><textPath href="#tb-top" startOffset="50%" textAnchor="middle">ZUFRIEDENHEIT</textPath></text>
        <text fontSize="7.6" fontWeight="800" fill="#ffd34d" letterSpacing="1.6"><textPath href="#tb-bot" startOffset="50%" textAnchor="middle">GARANTIE</textPath></text>
        <text x="50" y="50" textAnchor="middle" fontSize="17" fontWeight="900" fill="#0638b8" fontFamily="system-ui,Arial">100%</text>
        <path d="M41 56l6 5 12-11" fill="none" stroke="#0638b8" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
