import type { CSSProperties } from 'react';

/** Dezenter Schneefall fürs Weihnachts-Theme – reines CSS, feste Werte (kein Hydration-Mismatch) */
export default function Snow({ count = 28 }: { count?: number }) {
  const flakes = Array.from({ length: count }, (_, i) => {
    const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280; // deterministischer Zufall
    return {
      left: `${(r(1) * 100).toFixed(2)}%`,
      '--s': `${(3 + r(2) * 5).toFixed(1)}px`,
      '--d': `${(9 + r(3) * 12).toFixed(1)}s`,
      '--w': `${(-r(4) * 20).toFixed(1)}s`,
      '--x': `${(r(5) * 60 - 30).toFixed(0)}px`,
      opacity: +(0.45 + r(6) * 0.45).toFixed(2),
    } as CSSProperties;
  });
  return <div className="x-snow" aria-hidden>{flakes.map((s, i) => <i key={i} style={s} />)}</div>;
}
