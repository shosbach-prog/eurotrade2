import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, h1, infoBox, layout, offerTable, p, quote, signature } from '@/lib/mail-templates';
import { offerPdf } from '@/lib/pdf';
import { reviewDays, sendReviewRequest } from '@/lib/review-mail';
import { CARRIERS, createDhlLabel, deliveryNotePdf, markDelivered, sendProductionMail, sendShippingMail } from '@/lib/shipping';
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
      // nach Lieferung: Bewertungseinladung geht automatisch nach ein paar Tagen raus (täglicher Lauf)
      if (s === 'bestellt' && !i.shipment && !i.productionMailAt && body.mail !== false) {
        try { if (await sendProductionMail(i)) { i.productionMailAt = new Date().toISOString(); addHistory(i, 'Mail „in Produktion“ an Kunde gesendet'); extra = ' · Kunde informiert'; } } catch (e) { console.error('Produktionsmail fehlgeschlagen', e); extra = ' · Mail fehlgeschlagen'; }
      }
      if (s === 'geliefert' && !i.deliveredAt) { i.deliveredAt = new Date().toISOString(); if (!i.reviewRequestedAt) extra = ` · Bewertungseinladung folgt automatisch in ${reviewDays()} Tagen`; }
      saveInquiry(i);
    }
    return NextResponse.json({ ok: true, status: s, message: `Status: ${STATUS[s]}${extra}` });
  }

  if (body.action === 'review') {
    try { await sendReviewRequest(i); } catch { return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden.' }, { status: 500 }); }
    i.reviewRequestedAt = new Date().toISOString(); addHistory(i, 'Bewertungseinladung gesendet'); saveInquiry(i);
    return NextResponse.json({ ok: true, message: `Bewertungseinladung an ${i.customer.email} gesendet.` });
  }

  if (body.action === 'ship') {
    // Versand erfassen: Paketdienst + Sendungsnummer (oder DHL-Label erzeugen), Kunde bekommt Mail mit Sendungsverfolgung
    const carrier = CARRIERS[body.carrier] ? String(body.carrier) : 'dhl';
    let tracking = String(body.tracking ?? '').replace(/\s/g, '').slice(0, 40), labelId: string | null = null;
    if (body.dhlLabel) {
      try { const a = body.addr ?? {}; const r = await createDhlLabel(i, Number(body.weight) || 2, { name1: String(a.name1 ?? i.customer.company ?? i.customer.name), name2: String(a.name2 ?? (i.customer.company ? i.customer.name : '')), street: String(a.street ?? i.customer.street ?? ''), zip: String(a.zip ?? ''), city: String(a.city ?? '') }); tracking = r.tracking; labelId = r.labelId; }
      catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 400 }); }
    }
    if (carrier !== 'abholung' && !tracking) return NextResponse.json({ error: 'Bitte Sendungsnummer eintragen.' }, { status: 400 });
    i.shipment = { carrier, tracking, shippedAt: new Date().toISOString(), deliveredAt: null, labelId };
    if (i.status !== 'geliefert') i.status = 'bestellt';
    addHistory(i, carrier === 'abholung' ? 'Abholbereit gemeldet' : `Versendet mit ${CARRIERS[carrier].name} (${tracking})`);
    let mail = '';
    if (body.mail !== false) { try { if (await sendShippingMail(i)) mail = ' · Kunde informiert'; } catch (e) { console.error('Versandmail fehlgeschlagen', e); mail = ' · Mail fehlgeschlagen'; } }
    saveInquiry(i);
    return NextResponse.json({ ok: true, message: `Versand gespeichert${mail}.`, labelId });
  }
  if (body.action === 'delivered') { markDelivered(i, 'manuell'); return NextResponse.json({ ok: true, message: `Als geliefert markiert · Bewertungseinladung folgt in ${reviewDays()} Tagen.` }); }

  if (body.action === 'proof') {
    // Korrekturabzug zur Freigabe an den Kunden senden
    const ids = (Array.isArray(body.ids) ? body.ids : []).filter((x: any) => /^[a-f0-9]{24}$/.test(String(x?.id))).slice(0, 8).map((x: any) => ({ id: String(x.id), name: String(x.name ?? 'Vorschau').slice(0, 120) }));
    if (!ids.length) return NextResponse.json({ error: 'Bitte mindestens eine Vorschau hochladen.' }, { status: 400 });
    i.proof = { ...(i.proof ?? {}), ids, note: String(body.note ?? '').slice(0, 2000), sentAt: new Date().toISOString(), approvedAt: null, approvedBy: null };
    const link = `${shopUrl()}/angebot/${i.token}#freigabe`;
    try {
      await sendMail({ to: i.customer.email, replyTo: process.env.INQUIRY_TO, subject: `Bitte freigeben: Ihre Vorschau zu ${i.no}`,
        html: layout({ preheader: 'Bitte prüfen Sie Ihre Vorschau – mit einem Klick freigeben.', title: `Freigabe ${i.no}`,
          body: h1('Ihre Vorschau zur Freigabe')
            + p(`Guten Tag ${esc(i.customer.name)},`)
            + p('anbei die Vorschau Ihrer Veredelung. Bitte prüfen Sie Schreibweise, Farben, Position und Größe – erst nach Ihrer Freigabe starten wir die Produktion.')
            + (i.proof.note ? quote(i.proof.note) : '')
            + button(link, 'Vorschau ansehen & freigeben')
            + p('Etwas ändern? Einfach auf der Seite „Änderung wünschen“ klicken oder auf diese E-Mail antworten.', true)
            + signature() }) });
    } catch (e) { console.error('Freigabe-Mail fehlgeschlagen', e); addHistory(i, 'Vorschau gespeichert – E-Mail konnte nicht gesendet werden'); saveInquiry(i); return NextResponse.json({ error: 'Gespeichert, aber die E-Mail konnte nicht gesendet werden. Link manuell schicken: ' + link }, { status: 500 }); }
    addHistory(i, `Vorschau zur Freigabe gesendet (${ids.length} Datei${ids.length > 1 ? 'en' : ''})`);
    saveInquiry(i);
    return NextResponse.json({ ok: true, message: `Vorschau an ${i.customer.email} gesendet.` });
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

/** Lieferschein als PDF */
export async function GET(_req: Request, { params }: { params: { no: string } }) {
  if (!(await isAdmin())) return new Response('Nicht angemeldet', { status: 401 });
  const i = getInquiry(params.no);
  if (!i) return new Response('Nicht gefunden', { status: 404 });
  return new Response(await deliveryNotePdf(i), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="Lieferschein-${i.no}.pdf"` } });
}
