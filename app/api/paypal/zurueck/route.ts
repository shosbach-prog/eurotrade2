import { NextResponse } from 'next/server';
import { addHistory, inquiryByToken, offerTotals, saveInquiry } from '@/lib/store';
import { capturePaypalOrder } from '@/lib/paypal';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, eur, h1, infoBox, layout, p, signature } from '@/lib/mail-templates';

export const dynamic = 'force-dynamic';

/** Rückkehr von PayPal: Zahlung abschließen, Bestellung als bezahlt/angenommen markieren, Mails senden */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const i = inquiryByToken(u.searchParams.get('t') ?? '');
  const base = shopUrl();
  if (!i) return NextResponse.redirect(`${base}/`, 302);
  const back = (q: string) => NextResponse.redirect(`${base}/angebot/${i.token}?${q}`, 302);
  if (i.payment?.status === 'bezahlt') return back('bezahlt=1');
  const orderId = u.searchParams.get('token') ?? '';
  if (!i.payment?.orderId || orderId !== i.payment.orderId || !i.offer) return back('zahlung=fehler');
  try {
    const c = await capturePaypalOrder(orderId);
    const due = offerTotals(i.offer).gross;
    if (!c.completed || (c.amount != null && Math.abs(c.amount - due) > 0.01)) { addHistory(i, `PayPal-Zahlung nicht abgeschlossen (${c.amount ?? '–'} €)`); saveInquiry(i); return back('zahlung=fehler'); }
    i.payment = { ...i.payment, status: 'bezahlt', amount: c.amount ?? due, captureId: c.captureId, payer: c.payer, paidAt: new Date().toISOString() };
    i.status = 'angenommen';
    addHistory(i, `Bezahlt per PayPal: ${eur(i.payment.amount)}${c.captureId ? ` (Transaktion ${c.captureId})` : ''}`);
    saveInquiry(i);
    try {
      await sendMail({ to: process.env.INQUIRY_TO ?? '', replyTo: i.customer.email, subject: `💶 Bezahlt: ${i.no} – ${i.customer.name} – ${eur(i.payment.amount)}`,
        html: layout({ preheader: 'PayPal-Zahlung eingegangen', title: `Bezahlt ${i.no}`, body: h1(`Bezahlt: ${i.no}`) + infoBox([['Kunde', esc(i.customer.name)], ['Betrag', eur(i.payment.amount)], ['PayPal-Transaktion', esc(c.captureId ?? '–')], ['Lieferadresse', esc(`${i.customer.street ?? ''}, ${i.customer.city ?? ''}`)]], '#16a34a') + button(`${base}/admin/anfrage/${i.no}`, 'Auftrag öffnen →') }) });
      await sendMail({ to: i.customer.email, replyTo: process.env.INQUIRY_TO, subject: `Zahlung erhalten – Bestellung ${i.no}`,
        html: layout({ preheader: 'Vielen Dank – wir legen los.', title: 'Zahlung erhalten', body: h1('Zahlung erhalten – vielen Dank!') + p(`Guten Tag ${esc(i.customer.name)},`) + p(`wir haben Ihre Zahlung über <strong>${eur(i.payment.amount)}</strong> erhalten. Ihre Bestellung <strong>${i.no}</strong> geht jetzt in Produktion – sobald sie unterwegs ist, bekommen Sie die Sendungsnummer.`) + button(`${base}/angebot/${i.token}`, 'Bestellstatus ansehen') + signature() }) });
    } catch (e) { console.error('Zahlungsmail', e); }
    return back('bezahlt=1');
  } catch (e) {
    console.error('PayPal capture', e);
    return back('zahlung=fehler');
  }
}
