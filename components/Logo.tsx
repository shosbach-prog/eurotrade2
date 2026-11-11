/** euro-trade.com Logo: Bildmarke (E mit Handelspfeil) + Domain als Wortmarke */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="logo-mark">
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe45c" /><stop offset="1" stopColor="#ffb300" /></linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="13" fill="url(#lm-bg)" />
      <path d="M13 13h18M13 35h18M13 13v22M13 24h20" stroke="#0638b8" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M30 18.5 37 24l-7 5.5" stroke="#0638b8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Wortmarke „euro-trade.com“ – Domain aus SHOP_DOMAIN, „.com“ kleiner */
export function Wordmark({ domain = 'euro-trade.com' }: { domain?: string }) {
  const dot = domain.lastIndexOf('.');
  const main = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : '';
  const [a, ...rest] = main.split('-');
  return (
    <span className="logo-name">
      {a}{rest.length > 0 && <span className="logo-b">-{rest.join('-')}</span>}{tld && <span className="logo-tld">{tld}</span>}
    </span>
  );
}

export default function Logo({ domain = 'euro-trade.com' }: { domain?: string }) {
  return (
    <span className="logo-wrap">
      <LogoMark />
      <span className="logo-text">
        <Wordmark domain={domain} />
        <span className="logo-tag">Textil · Werbemittel · Veredelung</span>
      </span>
    </span>
  );
}
