// Gesamtbetrag einer Direktbestellung – im Browser (Warenkorb) und auf dem Server (Bestellung) identisch gerechnet,
// damit der angezeigte Betrag centgenau dem berechneten entspricht. Kein process.env hier.

/** Versand netto aus der Brutto-Pauschale */
export const shipNet = (shipGross: number, vat: number) => Math.round((shipGross / (1 + vat / 100)) * 100) / 100;

/** lines: Stückpreis netto × Menge; pct: Rabatt in % auf die Textilien; Rechenweg wie offerTotals() */
export function orderTotals(lines: { qty: number; price: number }[], o: { pct?: number; shipGross: number; vat: number }) {
  const goods = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const textil = lines.reduce((s, l) => s + Math.round(l.price * l.qty * 100) / 100, 0);
  const disc = o.pct ? Math.round(textil * o.pct) / 100 : 0;
  const ship = o.shipGross > 0 ? shipNet(o.shipGross, o.vat) : 0;
  const net = goods - disc + ship;
  const vatAmt = Math.round(net * o.vat) / 100;
  const gross = Math.round((net + vatAmt) * 100) / 100;
  return { net: Math.round(net * 100) / 100, vat: vatAmt, gross, shipGross: o.shipGross > 0 ? o.shipGross : 0, goodsGross: Math.round((gross - (o.shipGross > 0 ? o.shipGross : 0)) * 100) / 100, disc };
}
