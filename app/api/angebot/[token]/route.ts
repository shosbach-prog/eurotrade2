import { NextResponse } from 'next/server';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, eur, h1, infoBox, layout, offerTable, p, quote, signature } from '@/lib/mail-templates';
import { addHistory, inquiryByToken, listSubscribers, offerTotals, saveInquiry, saveSubscribers } from '@/lib/store';

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
  // Willkommensrabatt ist mit der Annahme eingelöst
  if (i.discount?.code) {
    const subs = listSubscribers();
    const s = subs.find((x) => x.code === i.discount!.code);
    if (s && !s.usedAt) { s.usedAt = new Date().toISOString(); s.usedIn = i.no; saveSubscribers(subs); }
  }
  const t = offerTotals(i.offer);
  try {
    await sendMail({ to: process.env.INQUIRY_TO ?? '', replyTo: i.customer.email, subject: `✓ Angebot ${i.no} angenommen – ${i.customer.company || i.customer.name} – ${eur(t.gross)}`,
      html: layout({ preheader: `${i.customer.company || i.customer.name} hat ${eur(t.gross)} angenommen`, title: `Angebot ${i.no} angenommen`,
        body: h1('✓ Angebot angenommen')
          + infoBox([['Angebot-Nr.', i.no], ['Kunde', esc(i.customer.company || i.customer.name)], ['Angenommen von', esc(name)], ['Gesamtbetrag', eur(t.gross)]], '#1d7a3e')
          + (comment ? `<div style="font-size:13px;font-weight:700;margin:0 0 6px">Anmerkung des Kunden</div>${quote(String(comment))}` : '')
          + p('Nächste Schritte: Ware bei L-Shop bestellen, Druck-/Stickvorschau zur Freigabe senden, Liefertermin bestätigen.', true)
          + button(`${shopUrl()}/admin/anfrage/${i.no}`, 'Im Admin öffnen →') }) });
    await sendMail({ to: i.customer.email, replyTo: process.env.INQUIRY_TO, subject: `Auftragsbestätigung zu Angebot ${i.no}`,
      html: layout({ preheader: 'Vielen Dank für Ihren Auftrag – so geht es weiter.', title: `Auftragsbestätigung ${i.no}`,
        body: h1('Vielen Dank für Ihren Auftrag!')
          + p(`Guten Tag ${esc(i.customer.name)},`)
          + p(`wir haben Ihre Annahme des Angebots <strong>${i.no}</strong> erhalten und machen uns an die Arbeit.`)
          + infoBox([['Auftrag', i.no], ['Gesamtbetrag', eur(t.gross)], ['Angenommen am', new Date().toLocaleDateString('de-DE')]], '#1d7a3e')
          + `<div style="font-size:15px;font-weight:700;margin:4px 0 8px">So geht es weiter</div>`
          + `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px">${['Wir bestellen die Textilien und prüfen Ihre Logo-Daten.', 'Sie erhalten eine Vorschau zur Druck- bzw. Stickfreigabe.', 'Nach Ihrer Freigabe produzieren wir – meist in 7–14 Werktagen.', 'Lieferung mit Sendungsverfolgung an Ihre Adresse.'].map((x, n) => `<tr><td valign="top" style="padding:4px 10px 4px 0"><span style="display:inline-block;width:22px;height:22px;border-radius:11px;background:#ffc21a;color:#14181f;font-weight:800;font-size:12px;text-align:center;line-height:22px">${n + 1}</span></td><td style="padding:4px 0;font-size:14px">${x}</td></tr>`).join('')}</table>`
          + offerTable(i.offer, t)
          + button(`${shopUrl()}/angebot/${params.token}`, 'Auftrag ansehen')
          + p('Bei Fragen antworten Sie einfach auf diese E-Mail.')
          + signature() }) });
  } catch (e) { console.error('Mail nach Annahme fehlgeschlagen', e); }
  return NextResponse.json({ ok: true });
}
