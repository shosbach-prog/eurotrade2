import 'server-only';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { offerTotals, type Inquiry } from './store';

const eur = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR';
const date = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const BRAND = rgb(0.039, 0.361, 0.941);
const INK = rgb(0.08, 0.09, 0.12);
const MUTED = rgb(0.36, 0.4, 0.46);
const LINE = rgb(0.86, 0.88, 0.91);

/** Absenderzeilen – überschreibbar per .env OFFER_SENDER="Zeile 1|Zeile 2|…" */
const sender = () => (process.env.OFFER_SENDER ?? 'Euro-Trade · Sebastian Hosbach|Seehan 28 · 44263 Dortmund|Tel. 0173 2648097 · info@euro-trade.com').split('|');

export async function offerPdf(i: Inquiry): Promise<Buffer> {
  const o = i.offer!;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(`Angebot ${i.no}`);
  doc.setAuthor(process.env.SHOP_NAME ?? 'Euro-Trade');

  // Nur Zeichen, die Helvetica (WinAnsi) kann – Rest ersetzen
  const ok = new Map<string, boolean>();
  const clean = (s: string) => Array.from(String(s ?? '')).map((ch) => {
    if (!ok.has(ch)) { try { font.encodeText(ch); ok.set(ch, true); } catch { ok.set(ch, false); } }
    return ok.get(ch) ? ch : ch === '✦' ? '*' : '?';
  }).join('');
  const wrap = (s: string, f: PDFFont, size: number, max: number) => {
    const out: string[] = [];
    for (const para of clean(s).split('\n')) {
      let line = '';
      for (const w of para.split(' ')) {
        const t = line ? `${line} ${w}` : w;
        if (f.widthOfTextAtSize(t, size) > max && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  };

  const W = 595.28, H = 841.89, L = 56, R = W - 56;
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - 56;
  const text = (s: string, x: number, yy: number, o2: { f?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; right?: boolean } = {}) => {
    const f = o2.f ?? font, size = o2.size ?? 10, t = clean(s);
    page.drawText(t, { x: o2.right ? x - f.widthOfTextAtSize(t, size) : x, y: yy, size, font: f, color: o2.color ?? INK });
  };
  const footer = () => {
    page.drawLine({ start: { x: L, y: 48 }, end: { x: R, y: 48 }, thickness: 0.5, color: LINE });
    text(sender().join('  ·  '), L, 36, { size: 7.5, color: MUTED });
  };

  // Kopf
  page.drawRectangle({ x: L, y: y - 22, width: 26, height: 26, color: rgb(1, 0.76, 0.1) });
  text('E', L + 7.5, y - 15, { f: bold, size: 15, color: rgb(0.024, 0.22, 0.72) });
  text('euro-trade', L + 36, y - 10, { f: bold, size: 18, color: BRAND });
  text('.com', L + 36 + bold.widthOfTextAtSize('euro-trade', 18), y - 10, { f: bold, size: 11, color: MUTED });
  text('Textil · Werbemittel · Veredelung', L + 36, y - 22, { size: 8, color: MUTED });
  sender().forEach((s, k) => text(s, R, y - 2 - k * 11, { size: 8.5, color: MUTED, right: true }));
  y -= 70;

  // Empfänger + Daten
  const c = i.customer;
  const addr = [c.company, c.name, c.city, c.email].filter(Boolean);
  text(sender()[0] + ' · ' + (sender()[1] ?? ''), L, y + 14, { size: 7, color: MUTED });
  addr.forEach((s, k) => text(s, L, y - k * 13, { size: 10.5, f: k === 0 ? bold : font }));
  const created = new Date(o.createdAt);
  const valid = new Date(created.getTime() + o.validDays * 86400000);
  [['Angebot-Nr.', i.no], ['Datum', date(created)], ['Gültig bis', date(valid)], ...(i.zugangscode ? [['Kunden-Code', i.zugangscode.split(' (')[0]]] : [])]
    .forEach(([k, v], n) => { text(k, R - 150, y - n * 13, { size: 9, color: MUTED }); text(v, R, y - n * 13, { size: 9.5, f: bold, right: true }); });
  y -= Math.max(addr.length, 4) * 13 + 30;

  text(`Angebot ${i.no}`, L, y, { f: bold, size: 16 });
  y -= 18;
  text(`Guten Tag ${c.name}, vielen Dank für Ihre Anfrage. Gerne bieten wir Ihnen an:`, L, y, { size: 10, color: MUTED });
  y -= 26;

  // Tabelle
  const cols = { pos: L, text: L + 28, qty: R - 175, price: R - 85, sum: R };
  const head = () => {
    page.drawRectangle({ x: L - 6, y: y - 6, width: R - L + 12, height: 20, color: rgb(0.94, 0.96, 0.99) });
    text('Pos.', cols.pos, y, { f: bold, size: 8.5 }); text('Artikel / Leistung', cols.text, y, { f: bold, size: 8.5 });
    text('Menge', cols.qty, y, { f: bold, size: 8.5, right: true }); text('Einzelpreis', cols.price, y, { f: bold, size: 8.5, right: true }); text('Gesamt', cols.sum, y, { f: bold, size: 8.5, right: true });
    y -= 22;
  };
  const newPage = () => { footer(); page = doc.addPage([W, H]); y = H - 60; head(); };
  head();
  o.lines.forEach((l, n) => {
    const t = wrap(l.text, bold, 9.5, cols.qty - cols.text - 50);
    const d = l.detail ? wrap(l.detail, font, 8.5, cols.qty - cols.text - 50) : [];
    const h = (t.length - 1) * 12 + d.length * 11 + 6;
    if (y - h < 120) newPage();
    text(String(n + 1), cols.pos, y, { size: 9.5 });
    t.forEach((s, k) => text(s, cols.text, y - k * 12, { f: bold, size: 9.5 }));
    d.forEach((s, k) => text(s, cols.text, y - t.length * 12 - k * 11 + 1, { size: 8.5, color: MUTED }));
    text(l.qty.toLocaleString('de-DE'), cols.qty, y, { size: 9.5, right: true });
    text(eur(l.price), cols.price, y, { size: 9.5, right: true });
    text(eur(l.qty * l.price), cols.sum, y, { size: 9.5, right: true });
    y -= h;
    page.drawLine({ start: { x: L - 6, y }, end: { x: R + 6, y }, thickness: 0.4, color: LINE });
    y -= 15;
  });

  // Summen
  const tot = offerTotals(o);
  if (y < 190) newPage();
  y -= 10;
  const sumRow = (k: string, v: string, b = false) => { text(k, cols.price, y, { size: b ? 11 : 9.5, f: b ? bold : font, right: true }); text(v, cols.sum, y, { size: b ? 11 : 9.5, f: b ? bold : font, right: true }); y -= b ? 18 : 14; };
  if (o.shipping) sumRow('Versand', eur(o.shipping));
  sumRow('Summe netto', eur(tot.net));
  sumRow(`zzgl. ${o.vat} % MwSt.`, eur(tot.vat));
  page.drawLine({ start: { x: cols.qty - 40, y: y + 10 }, end: { x: R, y: y + 10 }, thickness: 0.8, color: INK });
  y -= 4;
  sumRow('Gesamtbetrag', eur(tot.gross), true);
  y -= 14;

  const notes = [o.note, `Dieses Angebot ist gültig bis ${date(valid)}. Lieferzeit nach Auftragsbestätigung und Freigabe der Veredelung ca. 7–14 Werktage.`, 'Sie können das Angebot bequem über den Link in unserer E-Mail annehmen oder einfach auf diese E-Mail antworten.'].filter(Boolean) as string[];
  for (const n of notes) for (const s of wrap(n, font, 9.5, R - L)) { if (y < 80) { footer(); page = doc.addPage([W, H]); y = H - 60; } text(s, L, y, { size: 9.5 }); y -= 13; }
  y -= 8;
  text('Mit freundlichen Grüßen', L, y, { size: 9.5 });
  text(sender()[0], L, y - 13, { size: 9.5, f: bold });
  footer();
  return Buffer.from(await doc.save());
}
