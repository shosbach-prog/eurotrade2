import type { Margin } from '@/lib/margin';
const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

export default function MarginBox({ m }: { m: Margin | null }) {
  if (!m) return null;
  return (
    <div className={`box margin ${m.pct < 15 ? 'low' : m.pct < 30 ? 'mid' : 'good'}`}>
      <div><span>Umsatz netto</span><b>{eur(m.revenue)}</b></div>
      <div><span>EK Textil</span><b>−{eur(m.textileCost)}</b>{m.missingEk > 0 && <small className="err">{m.missingEk} Teile ohne EK</small>}</div>
      <div><span>Kosten Veredelung ({m.costPct} %)</span><b>−{eur(m.decoCost)}</b></div>
      <div className="m-res"><span>Marge (geschätzt)</span><b>{eur(m.margin)}</b><small>{m.pct.toLocaleString('de-DE')} %</small></div>
    </div>
  );
}
