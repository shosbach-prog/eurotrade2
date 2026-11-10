/** Euro-Trade Logo: Bildmarke (E mit Handelspfeil) + Wortmarke */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="logo-mark">
      <rect x="1" y="1" width="46" height="46" rx="12" fill="#f2b705" />
      <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#lg-shine)" />
      <path d="M13 13h18M13 35h18M13 13v22" stroke="#0a2f63" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M13 24h20" stroke="#0a2f63" strokeWidth="5" strokeLinecap="round" />
      <path d="M30 18.5 37 24l-7 5.5" stroke="#0a2f63" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <defs>
        <linearGradient id="lg-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Logo({ name = 'Euro-Trade' }: { name?: string }) {
  const [a, b] = name.split('-');
  return (
    <span className="logo-wrap">
      <LogoMark />
      <span className="logo-text">
        <span className="logo-name">{b ? <>{a}<span>{b}</span></> : name}</span>
        <span className="logo-tag">Textil · Werbemittel</span>
      </span>
    </span>
  );
}
