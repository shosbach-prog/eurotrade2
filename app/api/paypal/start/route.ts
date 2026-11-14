import { NextResponse } from 'next/server';
import { addHistory, inquiryByToken, offerTotals, saveInquiry } from '@/lib/store';
import { createPaypalOrder, paypalEnabled } from '@/lib/paypal';
import { shopUrl } from '@/lib/mail';

export const dynamic = 'force-dynamic';

/** Zahlung starten: PayPal-Bestellung über den Angebotsbetrag (brutto) anlegen und zu PayPal weiterleiten */
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('t') ?? '';
  const i = inquiryByToken(t);
  const base = shopUrl();
  if (!i) return NextResponse.redirect(`${base}/`, 302);
  const back = (q: string) => NextResponse.redirect(`${base}/angebot/${i.token}?${q}`, 302);
  if (!i.direct || !i.offer?.sentAt || !paypalEnabled()) return back('zahlung=nicht-verfuegbar');
  if (i.payment?.status === 'bezahlt') return back('bezahlt=1');
  const amount = offerTotals(i.offer).gross;
  try {
    const o = await createPaypalOrder({ ref: i.no, description: `Bestellung ${i.no} – euro-trade.com`, amount, returnUrl: `${base}/api/paypal/zurueck?t=${i.token}`, cancelUrl: `${base}/api/paypal/abbruch?t=${i.token}` });
    i.payment = { method: 'paypal', status: 'offen', amount, orderId: o.id, captureId: null, payer: null, paidAt: null };
    addHistory(i, `PayPal-Zahlung gestartet (${amount.toFixed(2).replace('.', ',')} €)`);
    saveInquiry(i);
    return NextResponse.redirect(o.approve, 302);
  } catch (e) {
    console.error('PayPal start', e);
    return back('zahlung=fehler');
  }
}
