import { NextResponse } from 'next/server';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { addHistory, inquiryByToken, offerTotals, saveInquiry } from '@/lib/store';

/** Kunde nimmt das Angebot an */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const i = inquiryByToken(params.token);
  if (!i?.offer?.sentAt) return NextResponse.json({ error: 'Angebot nicht gefunden.' }, { status: 404 });
  if (i.status === 'angenommen' || i.status === 'bestellt' || i.status === 'geliefert') return NextResponse.json({ ok: true, already: true });
  const valid = new Date(new Date(i.offer.createdAt).getTime() + i.offer.validDays * 86400000);
  if (Date.now() > valid.getTime() + 86400000) return NextResponse.json({ error: 'Dieses Angebot ist abgelaufen – bitte kontaktieren Sie uns für ein neues Angebot.' }, { status: 410 });
  const { name, comment } = await req.json().catch(() => ({}));
  if (!String(name ?? '').trim()) return NextResponse.json({ error: 'Bitte Ihren Namen angeben.' }, { status: 400 });

  i.status = 'angenommen';
  i.acceptedAt = new Date().toISOString();
  addHistory(i, `Angebot angenommen von ${String(name).slice(0, 100)}${comment ? ` – „${String(comment).slice(0, 500)}“` : ''}`);
  saveInquiry(i);
  const t = offerTotals(i.offer);
  try {
    await sendMail({ to: process.env.INQUIRY_TO ?? '', subject: `✓ Angebot ${i.no} angenommen – ${i.customer.company || i.customer.name}`,
      html: `<p><b>${esc(name)}</b> hat das Angebot <b>${i.no}</b> über ${t.gross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} angenommen.</p>${comment ? `<p>Kommentar: ${esc(comment)}</p>` : ''}<p><a href="${shopUrl()}/admin/anfrage/${i.no}">→ Im Admin öffnen</a></p>` });
    await sendMail({ to: i.customer.email, subject: `Auftragsbestätigung zu Angebot ${i.no}`,
      html: `<p>Guten Tag ${esc(i.customer.name)},</p><p>vielen Dank – wir haben Ihre Annahme des Angebots <b>${i.no}</b> erhalten und melden uns in Kürze mit der Druckfreigabe bzw. dem Liefertermin.</p><p>Mit freundlichen Grüßen<br>${esc(process.env.SHOP_NAME ?? 'Euro-Trade')}</p>` });
  } catch (e) { console.error('Mail nach Annahme fehlgeschlagen', e); }
  return NextResponse.json({ ok: true });
}
