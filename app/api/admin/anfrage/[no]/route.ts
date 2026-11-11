import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, h1, infoBox, layout, offerTable, p, quote, signature } from '@/lib/mail-templates';
import { offerPdf } from '@/lib/pdf';
import { sendReviewRequest } from '@/lib/review-mail';
import { STATUS, addHistory, getInquiry, offerTotals, randomId, saveInquiry, type Offer, type Status } from '@/lib/store';

const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

function cleanOffer(o: any, prev?: Offer | null): Offer {
  const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return {
    lines: (Array.isArray(o?.lines) ? o.lines : []).slice(0, 300).map((l: any) => ({
      text: String(l.text ?? '').slice(0, 300), detail: String(l.detail ?? '').slice(0, 300),
      qty: Math.max(0, Math.floor(n(l.qty))), price: Math.round(n(l.price) * 100) / 100,
    })).filter((l: any) => l.text.trim()),
    shipping: Math.max(0, Math.round(n(o?.shipping) * 100) / 100),
    note: String(o?.note ?? '').slice(0, 3000),
    validDays: Math.max(1, Math.min(365, Math.floor(n(o?.validDays) || 14))),
    vat: n(o?.vat) || Number(process.env.MWST_PERCENT ?? 19),
    createdAt: prev?.createdAt ?? new Date().toISOString(),
    sentAt: prev?.sentAt ?? null,
  };
}

export async function POST(req: Request, { params }: { params: { no: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const i = getInquiry(params.no);
  if (!i) return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  i.token ??= randomId(16);

  if (body.action === 'status') {
    const s = body.status as Status;
    if (!STATUS[s]) return NextResponse.json({ error: 'Unbekannter Status.' }, { status: 400 });
    let extra = '';
    if (s !== i.status) {
      i.status = s; addHistory(i, `Status: ${STATUS[s]}`);
      // nach Lieferung automatisch um eine Bewertung bitten (einmalig)
      if (s === 'geliefert' && !i.reviewRequestedAt) {
        try { if (await sendReviewRequest(i)) { i.reviewRequestedAt = new Date().toISOString(); addHistory(i, 'Bewertungseinladung gesendet'); extra = ' · Bewertungseinladung gesendet'; } }
        catch (e) { console.error('Bewertungseinladung fehlgeschlagen', e); }
      }
      saveInquiry(i);
    }
    return NextResponse.json({ ok: true, status: s, message: `Status: ${STATUS[s]}${extra}` });
  }

  if (body.action === 'review') {
    try { await sendReviewRequest(i); } catch { return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden.' }, { status: 500 }); }
    i.reviewRequestedAt = new Date().toISOString(); addHistory(i, 'Bewertungseinladung gesendet'); saveInquiry(i);
    return NextResponse.json({ ok: true, message: `Bewertungseinladung an ${i.customer.email} gesendet.` });
  }

  const first = !i.offer;
  i.offer = cleanOffer(body.offer, i.offer);
  if (!i.offer.lines.length) return NextResponse.json({ error: 'Das Angebot hat keine Positionen.' }, { status: 400 });

  if (body.action === 'save') {
    addHistory(i, first ? 'Angebot erstellt' : 'Angebot geändert');
    saveInquiry(i);
    return NextResponse.json({ ok: true, message: 'Angebot gespeichert.' });
  }

  if (body.action === 'send') {
    const t = offerTotals(i.offer);
    const link = `${shopUrl()}/angebot/${i.token}`;
    const shop = process.env.SHOP_NAME ?? 'Euro-Trade';
    let sent = false;
    try {
      const pdf = await offerPdf(i);
      sent = await sendMail({
        to: i.customer.email, replyTo: process.env.INQUIRY_TO,
        subject: `Ihr Angebot ${i.no} von ${shop}`,
        attachments: [{ filename: `Angebot-${i.no}.pdf`, content: pdf }],
        html: layout({
          preheader: `Ihr Angebot über ${eur(t.gross)} – mit einem Klick online annehmen.`, title: `Angebot ${i.no}`,
          body: h1(`Ihr Angebot ${i.no}`)
            + p(`Guten Tag ${esc(i.customer.name)},`)
            + p(`vielen Dank für Ihre Anfrage. Gerne bieten wir Ihnen Folgendes an – das Angebot finden Sie zusätzlich als PDF im Anhang.`)
            + infoBox([['Angebot-Nr.', i.no], ['Gesamtbetrag', `${eur(t.gross)}`], ['davon netto', eur(t.net)], ['Gültig bis', new Date(new Date(i.offer.createdAt).getTime() + i.offer.validDays * 86400000).toLocaleDateString('de-DE')]])
            + offerTable(i.offer, t)
            + (i.offer.note ? quote(i.offer.note) : '')
            + button(link, 'Angebot ansehen & annehmen', '#1d7a3e')
            + p('Nach Ihrer Annahme erhalten Sie von uns eine Vorschau zur Druck- bzw. Stickfreigabe. Erst danach geht Ihr Auftrag in Produktion.', true)
            + p('Fragen oder Änderungswünsche? Antworten Sie einfach auf diese E-Mail.')
            + signature(),
        }),
      });
    } catch (e) {
      console.error('Angebot senden fehlgeschlagen', e);
      return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden – SMTP-Daten prüfen.' }, { status: 500 });
    }
    i.offer.sentAt = new Date().toISOString();
    if (i.status === 'neu' || i.status === 'abgelehnt') i.status = 'angebot';
    addHistory(i, sent ? `Angebot per E-Mail gesendet an ${i.customer.email}` : 'Angebot als gesendet markiert (ohne E-Mail)');
    saveInquiry(i);
    return NextResponse.json({ ok: true, status: i.status, message: sent ? `Angebot an ${i.customer.email} gesendet.` : 'Kein SMTP eingerichtet – bitte den Annahme-Link unten selbst an den Kunden schicken.' });
  }
  return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
}
