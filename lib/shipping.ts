import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { esc, sendMail, shopUrl } from './mail';
import { button, h1, infoBox, layout, p, signature } from './mail-templates';
import { UPLOADS, addHistory, listInquiries, randomId, saveInquiry, writeJSON, type Inquiry } from './store';
import { invoiceSettings } from './invoice';
import { teamLabel } from './deco';
import { addWorkdays } from './leadtime';

export const CARRIERS: Record<string, { name: string; url: (t: string) => string }> = {
  dhl: { name: 'DHL', url: (t) => `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${encodeURIComponent(t)}` },
  dpd: { name: 'DPD', url: (t) => `https://tracking.dpd.de/status/de_DE/parcel/${encodeURIComponent(t)}` },
  gls: { name: 'GLS', url: (t) => `https://gls-group.com/DE/de/paketverfolgung?match=${encodeURIComponent(t)}` },
  ups: { name: 'UPS', url: (t) => `https://www.ups.com/track?loc=de_DE&tracknum=${encodeURIComponent(t)}` },
  hermes: { name: 'Hermes', url: (t) => `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation#${encodeURIComponent(t)}` },
  abholung: { name: 'Abholung / persönliche Übergabe', url: () => '' },
};
export const trackingUrl = (s?: Inquiry['shipment']) => (s && s.tracking && CARRIERS[s.carrier] ? CARRIERS[s.carrier].url(s.tracking) : '');
export const dhlLabelEnabled = () => !!(process.env.DHL_API_KEY && process.env.DHL_USER && process.env.DHL_PASS && process.env.DHL_BILLING);
const dhlTrackKey = () => process.env.DHL_TRACKING_KEY ?? process.env.DHL_API_KEY ?? '';
export const deliverDays = () => Math.max(1, Number(process.env.VERSAND_ZUSTELL_TAGE ?? 3));

/** „Evinger Str. 10a“ → ["Evinger Str.", "10a"] */
export function splitStreet(s: string) { const m = /^(.*?)\s*(\d+\s*[a-zA-Z]?(?:\s*[-/]\s*\d+\s*[a-zA-Z]?)?)\s*$/.exec(s.trim()); return m && m[1] ? [m[1].trim(), m[2].replace(/\s+/g, '')] : [s.trim(), '']; }

/** DHL-Versandlabel über die Geschäftskunden-API (Parcel DE Shipping v2) – nur wenn Zugangsdaten in der .env stehen */
export async function createDhlLabel(i: Inquiry, weightKg: number, addr: { name1: string; name2?: string; street: string; zip: string; city: string }) {
  if (!dhlLabelEnabled()) throw new Error('DHL-Zugang ist nicht eingerichtet (DHL_API_KEY, DHL_USER, DHL_PASS, DHL_BILLING in der .env).');
  const s = invoiceSettings();
  const [ss, sh] = splitStreet(s.street), [cs, ch] = splitStreet(addr.street);
  if (!ch) throw new Error('Bitte Hausnummer in der Lieferadresse angeben.');
  const base = process.env.DHL_SANDBOX === 'true' ? 'https://api-sandbox.dhl.com' : 'https://api-eu.dhl.com';
  const body = { profile: 'STANDARD_GRUPPENPROFIL', shipments: [{
    product: 'V01PAK', billingNumber: process.env.DHL_BILLING, refNo: i.no.padEnd(8, '0').slice(0, 35), shipDate: new Date().toISOString().slice(0, 10),
    shipper: { name1: s.company.slice(0, 50), addressStreet: ss.slice(0, 50), addressHouse: sh, postalCode: s.zip, city: s.city, country: 'DEU', email: s.email, phone: s.phone },
    consignee: { name1: addr.name1.slice(0, 50), ...(addr.name2 ? { name2: addr.name2.slice(0, 50) } : {}), addressStreet: cs.slice(0, 50), addressHouse: ch, postalCode: addr.zip, city: addr.city, country: 'DEU', email: i.customer.email },
    details: { weight: { uom: 'kg', value: Math.max(0.1, Math.min(31.5, weightKg)) } },
  }] };
  const r = await fetch(`${base}/parcel/de/shipping/v2/orders?includeDocs=include&docFormat=PDF`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'dhl-api-key': process.env.DHL_API_KEY!, Authorization: 'Basic ' + Buffer.from(`${process.env.DHL_USER}:${process.env.DHL_PASS}`).toString('base64') }, body: JSON.stringify(body),
  });
  const d: any = await r.json().catch(() => ({}));
  const item = d?.items?.[0];
  if (!r.ok || !item?.shipmentNo) throw new Error(`DHL: ${item?.validationMessages?.map((m: any) => m.validationMessage).join(' · ') || d?.status?.detail || d?.detail || r.status}`);
  let labelId: string | null = null;
  if (item.label?.b64) {
    labelId = randomId();
    fs.mkdirSync(UPLOADS, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS, `${labelId}.pdf`), Buffer.from(item.label.b64, 'base64'));
    writeJSON(path.join(UPLOADS, `${labelId}.json`), { name: `DHL-Label-${item.shipmentNo}.pdf`, ext: 'pdf', size: 0, date: new Date().toISOString() });
  }
  return { tracking: String(item.shipmentNo), labelId };
}

/** Versand-Mail mit Sendungsverfolgung */
export async function sendShippingMail(i: Inquiry) {
  const s = i.shipment!;
  const url = trackingUrl(s), pickup = s.carrier === 'abholung';
  const order = `${shopUrl()}/angebot/${i.token}`;
  return sendMail({
    to: i.customer.email, replyTo: process.env.INQUIRY_TO, subject: pickup ? `Ihre Bestellung ${i.no} ist abholbereit` : `Ihre Bestellung ${i.no} ist unterwegs`,
    html: layout({
      preheader: pickup ? 'Ihre Ware liegt zur Abholung bereit.' : `Versand mit ${CARRIERS[s.carrier]?.name ?? s.carrier} – Sendungsnummer ${s.tracking}`, title: 'Versand',
      body: h1(pickup ? 'Ihre Bestellung ist fertig!' : 'Ihre Bestellung ist unterwegs 📦')
        + p(`Guten Tag ${esc(i.customer.name)},`)
        + p(pickup ? `Ihre Bestellung <strong>${i.no}</strong> ist fertig und liegt zur Abholung bereit.` : `gute Nachrichten: Ihre Bestellung <strong>${i.no}</strong> hat unser Haus verlassen.`)
        + (pickup ? '' : infoBox([['Paketdienst', CARRIERS[s.carrier]?.name ?? esc(s.carrier)], ['Sendungsnummer', esc(s.tracking)], ['Voraussichtlich bei Ihnen', addWorkdays(new Date(), 2).toLocaleDateString('de-DE')]]))
        + (url ? button(url, 'Sendung verfolgen') : '')
        + p(`Den aktuellen Stand Ihres Auftrags sehen Sie jederzeit hier: <a href="${order}" style="color:#0a5cf0">Auftragsstatus</a>.`, true)
        + p('Etwas stimmt nicht? Antworten Sie einfach auf diese E-Mail – wir kümmern uns sofort.')
        + signature(),
    }),
  });
}

/** Mail beim Status „In Produktion“ – einmalig je Auftrag */
export async function sendProductionMail(i: Inquiry) {
  const order = `${shopUrl()}/angebot/${i.token}`;
  const days = Number(process.env.PRODUCTION_DAYS ?? 7);
  return sendMail({
    to: i.customer.email, replyTo: process.env.INQUIRY_TO, subject: `Ihr Auftrag ${i.no} ist in Produktion`,
    html: layout({
      preheader: 'Wir veredeln jetzt Ihre Textilien.', title: 'In Produktion',
      body: h1('Ihr Auftrag ist in Produktion 🧵')
        + p(`Guten Tag ${esc(i.customer.name)},`)
        + p(`Ihr Auftrag <strong>${i.no}</strong> ist freigegeben und wird jetzt gefertigt.`)
        + infoBox([['Auftrag', esc(i.no)], ['Voraussichtlicher Versand', addWorkdays(new Date(), days).toLocaleDateString('de-DE')]])
        + p('Sobald das Paket unterwegs ist, bekommen Sie eine weitere E-Mail mit der Sendungsnummer.')
        + button(order, 'Auftragsstatus ansehen')
        + signature(),
    }),
  });
}

/** Zustellung erkannt (DHL-Tracking) oder nach X Werktagen angenommen → Status „geliefert“, Bewertungseinladung folgt automatisch */
export function markDelivered(i: Inquiry, how: string) {
  if (!i.shipment) return;
  i.shipment.deliveredAt = new Date().toISOString();
  if (i.status !== 'geliefert') { i.status = 'geliefert'; i.deliveredAt = i.shipment.deliveredAt; addHistory(i, `Status: Geliefert (${how})`); }
  saveInquiry(i);
}
export async function runShippingChecks() {
  let n = 0;
  for (const i of listInquiries()) {
    const s = i.shipment;
    if (!s || s.deliveredAt || i.status === 'geliefert' || i.status === 'abgelehnt') continue;
    if (s.carrier === 'dhl' && dhlTrackKey()) {
      try {
        const r = await fetch(`https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(s.tracking)}&service=parcel-de&language=de`, { headers: { 'DHL-API-Key': dhlTrackKey() } });
        const d: any = await r.json().catch(() => ({}));
        const st = d?.shipments?.[0]?.status;
        s.lastCheck = new Date().toISOString(); s.status = st?.description ?? st?.statusCode ?? s.status;
        if (st?.statusCode === 'delivered') { markDelivered(i, 'laut DHL zugestellt'); n++; continue; }
        saveInquiry(i);
        if (Date.now() - Date.parse(s.shippedAt) < 10 * 864e5) continue; // Tracking läuft – nicht schätzen
      } catch {}
    }
    if (s.carrier !== 'abholung' && Date.now() >= addWorkdays(new Date(s.shippedAt), deliverDays()).getTime()) { markDelivered(i, `${deliverDays()} Werktage nach Versand`); n++; }
  }
  return n;
}

/** Lieferschein (ohne Preise) – liegt dem Paket bei */
export async function deliveryNotePdf(i: Inquiry): Promise<Buffer> {
  const s = invoiceSettings();
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ok = new Map<string, boolean>();
  const clean = (t: string) => Array.from(String(t ?? '')).map((ch) => { if (!ok.has(ch)) { try { font.encodeText(ch); ok.set(ch, true); } catch { ok.set(ch, false); } } return ok.get(ch) ? ch : '?'; }).join('');
  const W = 595.28, H = 841.89, L = 56, R = W - 56, MUT = rgb(0.36, 0.4, 0.46), LINE = rgb(0.86, 0.88, 0.91);
  let page = doc.addPage([W, H]); let y = H - 56;
  const t = (x: string, xx: number, yy: number, o: { b?: boolean; size?: number; mut?: boolean; right?: boolean } = {}) => { const f = o.b ? bold : font, sz = o.size ?? 10, c = clean(x); page.drawText(c, { x: o.right ? xx - f.widthOfTextAtSize(c, sz) : xx, y: yy, size: sz, font: f, color: o.mut ? MUT : rgb(0.08, 0.09, 0.12) }); };
  page.drawRectangle({ x: L, y: y - 22, width: 26, height: 26, color: rgb(1, 0.76, 0.1) }); t('E', L + 7.5, y - 15, { b: true, size: 15 });
  t('euro-trade.com', L + 36, y - 10, { b: true, size: 18 }); t(`${s.company} · ${s.street} · ${s.zip} ${s.city} · ${s.phone}`, R, y - 2, { size: 8.5, mut: true, right: true });
  y -= 80;
  const c = i.customer;
  [c.company, c.name, c.street, c.city].filter(Boolean).forEach((x, k) => t(x, L, y - k * 13, { size: 10.5, b: k === 0 }));
  [['Lieferschein zu', i.no], ['Datum', new Date().toLocaleDateString('de-DE')], ...(i.shipment?.tracking ? [['Sendungsnummer', i.shipment.tracking]] : [])].forEach(([k, v], n) => { t(k, R - 170, y - n * 13, { size: 9, mut: true }); t(v, R, y - n * 13, { size: 9.5, b: true, right: true }); });
  y -= 80; t(`Lieferschein ${i.no}`, L, y, { b: true, size: 16 }); y -= 28;
  page.drawRectangle({ x: L - 6, y: y - 6, width: R - L + 12, height: 20, color: rgb(0.94, 0.96, 0.99) });
  t('Art.-Nr.', L, y, { b: true, size: 8.5 }); t('Artikel', L + 70, y, { b: true, size: 8.5 }); t('Farbe', L + 290, y, { b: true, size: 8.5 }); t('Größe', L + 380, y, { b: true, size: 8.5 }); t('Menge', R, y, { b: true, size: 8.5, right: true }); y -= 22;
  for (const l of i.lines) {
    if (y < 110) { page = doc.addPage([W, H]); y = H - 60; }
    t(l.sku, L, y, { size: 9.5 }); t(l.name.slice(0, 42) + (l.sample ? ' (Muster)' : ''), L + 70, y, { size: 9.5 }); t(l.color, L + 290, y, { size: 9.5 }); t(l.size, L + 380, y, { size: 9.5 }); t(String(l.qty), R, y, { size: 9.5, b: true, right: true });
    y -= 13;
    if (l.deco) { t(`Veredelung: ${l.deco.method} ${l.deco.positions.join(', ')}${l.deco.team?.rows.length ? ` · ${teamLabel(l.deco.team.rows)}` : ''}`.slice(0, 120), L + 70, y, { size: 8, mut: true }); y -= 11; }
    page.drawLine({ start: { x: L - 6, y: y + 4 }, end: { x: R + 6, y: y + 4 }, thickness: 0.4, color: LINE }); y -= 8;
  }
  y -= 10; t(`Gesamt: ${i.lines.reduce((a, l) => a + l.qty, 0)} Teile`, R, y, { b: true, size: 10, right: true });
  y -= 40; t('Bitte prüfen Sie die Lieferung auf Vollständigkeit. Reklamationen bitte innerhalb von 7 Tagen an ' + s.email + '.', L, y, { size: 9, mut: true });
  return Buffer.from(await doc.save());
}
