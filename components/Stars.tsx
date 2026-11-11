/** Sterne mit Teilfüllung, z. B. 4,6 */
export default function Stars({ value, size = 16, count, showValue }: { value: number; size?: number; count?: number; showValue?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (fill: string) => Array.from({ length: 5 }, (_, i) => (
    <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden><path fill={fill} d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
  ));
  return (
    <span className="stars" aria-label={`${value.toLocaleString('de-DE', { maximumFractionDigits: 1 })} von 5 Sternen${count != null ? `, ${count} Bewertungen` : ''}`}>
      <span className="stars-in" style={{ height: size }}>
        <span className="stars-bg">{row('#d9dde3')}</span>
        <span className="stars-fg" style={{ width: `${pct}%` }}>{row('#ffb300')}</span>
      </span>
      {showValue && <b>{value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b>}
      {count != null && <span className="stars-n">({count.toLocaleString('de-DE')})</span>}
    </span>
  );
}
