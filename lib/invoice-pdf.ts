import 'server-only';
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import { dueDate, invoiceTotals, type Invoice, type InvoiceSettings } from './invoice';

const eur = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const date = (d: string | Date) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const BRAND = rgb(0.039, 0.361, 0.941), INK = rgb(0.08, 0.09, 0.12), MUTED = rgb(0.36, 0.4, 0.46), LINE = rgb(0.86, 0.88, 0.91);

/** Rechnung als PDF mit allen Pflichtangaben nach § 14 UStG und GiroCode zum Bezahlen */
export async function invoicePdf(inv: Invoice, s: InvoiceSettings): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const storno = inv.kind === 'storno', draft = !inv.no;
  const title = `${storno ? 'Rechnungskorrektur (Storno)' : 'Rechnung'} ${inv.no ?? 'ENTWURF'}`;
  doc.setTitle(title); doc.setAuthor(s.company);
  const ok = new Map<string, boolean>();
  const clean = (t: string) => Array.from(String(t ?? '')).map((ch) => { if (!ok.has(ch)) { try { font.encodeText(ch); ok.set(ch, true); } catch { ok.set(ch, false); } } return ok.get(ch) ? ch : '?'; }).join('');
  const wrap = (t: string, f: PDFFont, size: number, max: number) => { const out: string[] = []; for (const para of clean(t).split('\n')) { let line = ''; for (const w of para.split(' ')) { const n = line ? `${line} ${w}` : w; if (f.widthOfTextAtSize(n, size) > max && line) { out.push(line); line = w; } else line = n; } out.push(line); } return out; };
  const W = 595.28, H = 841.89, L = 56, R = W - 56;
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - 56;
  const text = (t: string, x: number, yy: number, o: { f?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; right?: boolean } = {}) => { const f = o.f ?? font, size = o.size ?? 10, c = clean(t); page.drawText(c, { x: o.right ? x - f.widthOfTextAtSize(c, size) : x, y: yy, size, font: f, color: o.color ?? INK }); };
  const mark = () => { if (draft) page.drawText('ENTWURF', { x: 150, y: 300, size: 90, font: bold, color: rgb(0.9, 0.2, 0.2), opacity: 0.12, rotate: degrees(35) }); };
  const footer = () => {
    page.drawLine({ start: { x: L, y: 70 }, end: { x: R, y: 70 }, thickness: 0.5, color: LINE });
    const cols = [
      [s.company, s.owner ? `Inhaber: ${s.owner}` : '', `${s.street}, ${s.zip} ${s.city}`],
      [`Tel. ${s.phone}`, s.email, s.web],
      [s.taxNo ? `Steuernummer: ${s.taxNo}` : '', s.vatId ? `USt-IdNr.: ${s.vatId}` : '', s.footer],
      [s.bank, s.iban ? `IBAN: ${s.iban}` : '', s.bic ? `BIC: ${s.bic}` : ''],
    ];
    cols.forEach((c, k) => c.filter(Boolean).forEach((t, n) => text(t, L + k * ((R - L) / 4), 58 - n * 9, { size: 6.8, color: MUTED })));
  };
  mark();
  // Kopf
  page.drawRectangle({ x: L, y: y - 22, width: 26, height: 26, color: rgb(1, 0.76, 0.1) });
  text('E', L + 7.5, y - 15, { f: bold, size: 15, color: rgb(0.024, 0.22, 0.72) });
  text('euro-trade', L + 36, y - 10, { f: bold, size: 18, color: BRAND });
  text('.com', L + 36 + bold.widthOfTextAtSize('euro-trade', 18), y - 10, { f: bold, size: 11, color: MUTED });
  text('Textil · Werbemittel · Veredelung', L + 36, y - 22, { size: 8, color: MUTED });
  [s.company + (s.owner ? ` · ${s.owner}` : ''), `${s.street} · ${s.zip} ${s.city}`, `Tel. ${s.phone} · ${s.email}`].forEach((t, k) => text(t, R, y - 2 - k * 11, { size: 8.5, color: MUTED, right: true }));
  y -= 78;
  // Empfänger
  const b = inv.buyer;
  text(`${s.company} · ${s.street} · ${s.zip} ${s.city}`, L, y + 14, { size: 6.8, color: MUTED });
  const addr = [b.company, b.name, b.street, [b.zip, b.city].filter(Boolean).join(' '), b.country && b.country !== 'DE' ? b.country : ''].filter(Boolean);
  addr.forEach((t, k) => text(t, L, y - k * 13, { size: 10.5, f: k === 0 ? bold : font }));
  const meta: [string, string][] = [['Rechnungs-Nr.', inv.no ?? '– (Entwurf)'], ['Rechnungsdatum', date(inv.date)], ['Leistungsdatum', date(inv.serviceDate || inv.date)], ...(b.reference ? [['Ihre Referenz', b.reference] as [string, string]] : []), ...(b.vatId ? [['Ihre USt-IdNr.', b.vatId] as [string, string]] : []), ...(inv.refNo ? [['zu Rechnung', inv.refNo] as [string, string]] : [])];
  meta.forEach(([k, v], n) => { const sz = bold.widthOfTextAtSize(clean(v), 9.5) > 120 ? 7.5 : 9.5; text(k, R - 215, y - n * 13, { size: 9, color: MUTED }); text(v, R, y - n * 13, { size: sz, f: bold, right: true }); });
  y -= Math.max(addr.length, meta.length) * 13 + 30;
  text(title, L, y, { f: bold, size: 16 }); y -= 18;
  text(storno ? `Hiermit stornieren wir die Rechnung ${inv.refNo}. Der Betrag wird erstattet bzw. verrechnet.` : 'Vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Leistungen:', L, y, { size: 10, color: MUTED }); y -= 26;
  // Tabelle
  const sg = storno ? -1 : 1;
  const cols = { pos: L, text: L + 28, qty: R - 175, price: R - 85, sum: R };
  const head = () => { page.drawRectangle({ x: L - 6, y: y - 6, width: R - L + 12, height: 20, color: rgb(0.94, 0.96, 0.99) }); text('Pos.', cols.pos, y, { f: bold, size: 8.5 }); text('Leistung', cols.text, y, { f: bold, size: 8.5 }); text('Menge', cols.qty, y, { f: bold, size: 8.5, right: true }); text('Einzelpreis', cols.price, y, { f: bold, size: 8.5, right: true }); text('Gesamt netto', cols.sum, y, { f: bold, size: 8.5, right: true }); y -= 22; };
  const newPage = () => { footer(); page = doc.addPage([W, H]); mark(); y = H - 60; head(); };
  head();
  const rows = [...inv.lines, ...(inv.shipping ? [{ text: 'Versand', qty: 1, unit: 'Pausch', price: inv.shipping }] : [])];
  rows.forEach((l, n) => {
    const t = wrap(l.text, bold, 9.5, cols.qty - cols.text - 50), dd = 'detail' in l && l.detail ? wrap(l.detail, font, 8.5, cols.qty - cols.text - 50) : [];
    const h = (t.length - 1) * 12 + dd.length * 11 + 6;
    if (y - h < 150) newPage();
    text(String(n + 1), cols.pos, y, { size: 9.5 });
    t.forEach((x, k) => text(x, cols.text, y - k * 12, { f: bold, size: 9.5 }));
    dd.forEach((x, k) => text(x, cols.text, y - t.length * 12 - k * 11 + 1, { size: 8.5, color: MUTED }));
    text(`${l.qty.toLocaleString('de-DE')} ${l.unit}`, cols.qty, y, { size: 9.5, right: true });
    text(eur(sg * l.price), cols.price, y, { size: 9.5, right: true });
    text(eur(sg * l.qty * l.price), cols.sum, y, { size: 9.5, right: true });
    y -= h; page.drawLine({ start: { x: L - 6, y }, end: { x: R + 6, y }, thickness: 0.4, color: LINE }); y -= 15;
  });
  // Summen
  const t = invoiceTotals(inv);
  if (y < 240) newPage();
  y -= 6;
  const sumRow = (k: string, v: string, b2 = false) => { text(k, cols.price, y, { size: b2 ? 11 : 9.5, f: b2 ? bold : font, right: true }); text(v, cols.sum, y, { size: b2 ? 11 : 9.5, f: b2 ? bold : font, right: true }); y -= b2 ? 18 : 14; };
  sumRow('Summe netto', eur(sg * t.net));
  sumRow(inv.kleinunternehmer ? 'Umsatzsteuer' : `zzgl. ${t.rate} % USt. auf ${eur(sg * t.net)}`, eur(sg * t.vat));
  page.drawLine({ start: { x: cols.qty - 60, y: y + 10 }, end: { x: R, y: y + 10 }, thickness: 0.8, color: INK }); y -= 4;
  sumRow(storno ? 'Gutschriftsbetrag' : 'Rechnungsbetrag', eur(sg * t.gross), true);
  y -= 10;
  // Zahlung + GiroCode
  const due = dueDate(inv);
  const notes = [
    inv.kleinunternehmer ? 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).' : '',
    storno ? '' : `Bitte überweisen Sie ${eur(t.gross)} bis zum ${date(due)} ohne Abzug${s.iban ? ` auf das Konto IBAN ${s.iban}${s.bic ? ` (BIC ${s.bic})` : ''}${s.bank ? `, ${s.bank}` : ''}` : ''}. Verwendungszweck: ${inv.no ?? 'Rechnungsnummer'}.`,
    inv.note,
  ].filter(Boolean);
  let qrH = 0;
  if (!storno && s.iban && inv.no && t.gross > 0) {
    try {
      const epc = ['BCD', '002', '1', 'SCT', s.bic.replace(/\s/g, ''), (s.owner || s.company).slice(0, 70), s.iban.replace(/\s/g, ''), `EUR${t.gross.toFixed(2)}`, '', '', inv.no, ''].join('\n');
      const png = await QRCode.toBuffer(epc, { errorCorrectionLevel: 'M', margin: 1, width: 240 });
      const im = await doc.embedPng(png);
      if (y < 190) { footer(); page = doc.addPage([W, H]); mark(); y = H - 60; }
      page.drawImage(im, { x: R - 84, y: y - 84, width: 84, height: 84 });
      text('GiroCode: mit der', R - 84, y - 94, { size: 7, color: MUTED }); text('Banking-App scannen', R - 84, y - 103, { size: 7, color: MUTED });
      qrH = 110;
    } catch {}
  }
  const maxW = qrH ? R - L - 100 : R - L;
  const top = y;
  for (const n of notes) for (const line of wrap(n, font, 9.5, maxW)) { if (y < 100) { footer(); page = doc.addPage([W, H]); mark(); y = H - 60; } text(line, L, y, { size: 9.5 }); y -= 13; }
  y = Math.min(y, top - qrH) - 8;
  if (y < 100) { footer(); page = doc.addPage([W, H]); mark(); y = H - 60; }
  text('Mit freundlichen Grüßen', L, y, { size: 9.5 }); text(s.company, L, y - 13, { size: 9.5, f: bold });
  footer();
  return Buffer.from(await doc.save());
}
