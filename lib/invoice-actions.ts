import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { esc, sendMail, shopUrl } from './mail';
import { button, eur, h1, infoBox, layout, p, signature } from './mail-templates';
import { amountDue, creditable, isCredit, kindLabel, dueDate, getInvoice, invHistory, invoicePdfPath, invoiceSettings, invoiceTotals, invoiceXmlPath, listInvoices, nextNumber, randomIdInv, saveInvoice, settingsMissing, type Invoice } from './invoice';
import { invoicePdf } from './invoice-pdf';
import { xrechnung } from './xrechnung';
import { addHistory, getInquiry, saveInquiry } from './store';

const fmt = (d: string | Date) => new Date(d).toLocaleDateString('de-DE');

/** Prüfen, ob die Rechnung vollständig ist (Pflichtangaben) */
export function invoiceProblems(i: Invoice) {
  const m = settingsMissing().map((x) => `Einstellungen: ${x} fehlt`);
  const b = i.buyer;
  if (!(b.company || b.name)) m.push('Name des Kunden fehlt');
  if (!b.street || !b.zip || !b.city) m.push('Vollständige Anschrift des Kunden fehlt');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) m.push('E-Mail des Kunden fehlt');
  if (!i.lines.length || i.lines.some((l) => !l.text.trim())) m.push('Positionen ohne Bezeichnung');
  if (invoiceTotals(i).gross <= 0 && (i.kind === 'rechnung' || i.kind === 'gutschrift')) m.push(i.kind === 'gutschrift' ? 'Gutschriftsbetrag ist 0 – Menge oder Betrag eintragen' : 'Rechnungsbetrag ist 0');
  if (i.kind === 'gutschrift') { const o = listInvoices().find((x) => x.no === i.refNo); const max = o ? creditable(o) : 0; if (invoiceTotals(i).gross > max + 0.005) m.push(`Gutschrift ist höher als der noch offene Rechnungsbetrag (max. ${eur(max)})`); }
  return m;
}

/** Festschreiben: Nummer vergeben, PDF + XRechnung erzeugen und unveränderbar archivieren (GoBD) */
export async function finalizeInvoice(i: Invoice) {
  if (i.no) return i;
  const probs = invoiceProblems(i);
  if (probs.length) throw new Error(probs.join(' · '));
  const s = invoiceSettings();
  if (i.kind === 'gutschrift') i.lines = i.lines.filter((l) => l.qty !== 0 && l.price !== 0);
  const orig = i.kind === 'gutschrift' ? listInvoices().find((x) => x.no === i.refNo) ?? null : null;
  if (orig) {
    const t = invoiceTotals(i);
    // vor der Gutschrift: noch offen → verrechnen; schon bezahlt → erstatten
    const openBefore = orig.status === 'offen' ? amountDue(orig) : 0;
    const settle = Math.min(openBefore, t.gross);
    i.settleNote = settle >= t.gross - 0.005 ? `Der Betrag wird mit Rechnung ${orig.no} verrechnet. Offener Restbetrag der Rechnung: ${eur(Math.max(0, openBefore - t.gross))}.`
      : settle > 0 ? `${eur(settle)} werden mit Rechnung ${orig.no} verrechnet, ${eur(t.gross - settle)} erstatten wir Ihnen auf Ihr Konto.`
      : `Den Betrag von ${eur(t.gross)} erstatten wir Ihnen innerhalb von 14 Tagen auf Ihr Konto.`;
    i.paidAmount = Math.round((t.gross - settle) * 100) / 100; // offener Erstattungsbetrag
  }
  i.no = nextNumber(new Date(i.date).getFullYear());
  i.seller = { ...s, counter: {} };
  i.status = i.kind === 'storno' || (i.kind === 'gutschrift' && !i.paidAmount) || (!isCredit(i) && amountDue(i) <= 0) ? 'bezahlt' : 'offen';
  i.finalizedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(invoicePdfPath(i.no)), { recursive: true });
  fs.writeFileSync(invoicePdfPath(i.no), await invoicePdf(i, i.seller));
  fs.writeFileSync(invoiceXmlPath(i.no), xrechnung(i, i.seller));
  invHistory(i, `Festgeschrieben als ${i.no}`);
  if (i.kind === 'gutschrift') { invHistory(i, i.status === 'offen' ? `Erstattung offen: ${eur(i.paidAmount ?? 0)}` : 'Vollständig verrechnet'); i.paidAt = i.status === 'bezahlt' ? i.date : null; }
  saveInvoice(i);
  if (orig) {
    orig.credits = [...(orig.credits ?? []), { no: i.no, date: i.date, gross: invoiceTotals(i).gross }];
    invHistory(orig, `Gutschrift ${i.no} über ${eur(invoiceTotals(i).gross)}`);
    if (creditable(orig) <= 0.005) { orig.status = 'storniert'; orig.stornoNo = i.no; }
    else if (orig.status === 'offen' && amountDue(orig) <= 0.005) { orig.status = 'bezahlt'; orig.paidAt = i.date; }
    saveInvoice(orig);
  }
  await autoExport(i);
  if (i.inquiryNo) { const q = getInquiry(i.inquiryNo); if (q) { addHistory(q, `${kindLabel(i)} ${i.no} erstellt (${eur(invoiceTotals(i).gross)})`); saveInquiry(q); } }
  return i;
}
export const archivedPdf = (i: Invoice) => (i.no && fs.existsSync(invoicePdfPath(i.no)) ? fs.readFileSync(invoicePdfPath(i.no)) : null);
export const archivedXml = (i: Invoice) => (i.no && fs.existsSync(invoiceXmlPath(i.no)) ? fs.readFileSync(invoiceXmlPath(i.no)) : null);

/** Rechnung per E-Mail: PDF + XRechnung (XML) im Anhang, Link zum Download */
export async function sendInvoice(i: Invoice, kind: 'rechnung' | 'erinnerung' = 'rechnung') {
  if (!i.no) throw new Error('Rechnung ist noch nicht festgeschrieben.');
  const s = i.seller ?? invoiceSettings();
  const t = invoiceTotals(i), due = dueDate(i), link = `${shopUrl()}/rechnung/${i.token}`, pay = amountDue(i);
  const storno = isCredit(i), rem = kind === 'erinnerung';
  const pdf = archivedPdf(i), xml = archivedXml(i);
  const subject = rem ? `Zahlungserinnerung: Rechnung ${i.no}` : storno ? `${i.kind === 'gutschrift' ? 'Gutschrift' : 'Rechnungskorrektur'} ${i.no} zu Rechnung ${i.refNo}` : `Ihre ${kindLabel(i)} ${i.no} von ${s.company}`;
  const ok = await sendMail({
    to: i.buyer.email, replyTo: process.env.INQUIRY_TO, subject,
    attachments: [...(pdf ? [{ filename: `${i.no}.pdf`, content: pdf }] : []), ...(xml ? [{ filename: `${i.no}-xrechnung.xml`, content: xml }] : [])],
    html: layout({
      preheader: rem ? `Rechnung ${i.no} über ${eur(t.gross)} war am ${fmt(due)} fällig.` : `Rechnung über ${eur(t.gross)} – zahlbar bis ${fmt(due)}.`, title: subject,
      body: h1(rem ? 'Freundliche Zahlungserinnerung' : storno ? 'Ihre Rechnungskorrektur' : 'Ihre Rechnung')
        + p(`Guten Tag ${esc(i.buyer.name || i.buyer.company)},`)
        + (rem ? p(`sicher ist es Ihrer Aufmerksamkeit entgangen: Unsere Rechnung <strong>${i.no}</strong> vom ${fmt(i.date)} war am <strong>${fmt(due)}</strong> fällig. Falls Sie bereits gezahlt haben, betrachten Sie diese E-Mail bitte als gegenstandslos.`)
          : storno ? p(`anbei ${i.kind === 'gutschrift' ? 'Ihre Gutschrift' : 'die Rechnungskorrektur'} zu Rechnung <strong>${i.refNo}</strong>.${i.settleNote ? ` ${esc(i.settleNote)}` : ''}`)
          : p(`vielen Dank für Ihren Auftrag! Anbei erhalten Sie Ihre Rechnung als PDF und als E-Rechnung (XRechnung) für Ihre Buchhaltung.`))
        + infoBox([['Rechnungs-Nr.', i.no], ['Betrag', eur(t.gross)], ...(i.prepaid?.length ? [['Zu zahlen (nach Abschlägen)', eur(pay)] as [string, string]] : []), ...(storno ? [] : [['Fällig am', fmt(due)] as [string, string]]), ...(!storno && s.iban ? [['IBAN', esc(s.iban)] as [string, string], ['Verwendungszweck', i.no] as [string, string]] : [])], rem ? '#ffc21a' : '#0a5cf0')
        + button(link, 'Rechnung ansehen & herunterladen')
        + p('Fragen zur Rechnung? Antworten Sie einfach auf diese E-Mail.', true)
        + signature(),
    }),
  });
  if (!ok) throw new Error('E-Mail-Versand ist nicht eingerichtet (Admin → System).');
  if (rem) { i.reminders = [...(i.reminders ?? []), new Date().toISOString()]; invHistory(i, `Zahlungserinnerung gesendet an ${i.buyer.email}`); }
  else { i.sentAt = new Date().toISOString(); invHistory(i, `Per E-Mail gesendet an ${i.buyer.email}`); }
  saveInvoice(i);
  return i;
}

/** Storno: Korrekturrechnung mit Bezug auf das Original (Original bleibt unverändert archiviert) */
export async function stornoInvoice(orig: Invoice) {
  if (!orig.no || isCredit(orig) || orig.status === 'storniert') throw new Error('Nur offene oder bezahlte Rechnungen können storniert werden.');
  if (orig.credits?.length) throw new Error('Zu dieser Rechnung gibt es schon eine Gutschrift – bitte den Rest ebenfalls per Gutschrift korrigieren.');
  const s: Invoice = { ...orig, id: randomIdInv(), no: null, kind: 'storno', status: 'entwurf', token: randomIdInv(16), date: new Date().toISOString().slice(0, 10), refNo: orig.no, stornoNo: null,
    createdAt: new Date().toISOString(), finalizedAt: null, sentAt: null, paidAt: null, paidAmount: null, reminders: [], history: [{ date: new Date().toISOString(), text: `Storno zu ${orig.no}` }] };
  await finalizeInvoice(s);
  orig.status = 'storniert'; orig.stornoNo = s.no; invHistory(orig, `Storniert durch ${s.no}`); saveInvoice(orig);
  return s;
}

/** Täglicher Lauf: Zahlungserinnerung X Tage nach Fälligkeit (max. 2, im Abstand von 7 Tagen) */
export async function runPaymentReminders() {
  const s = invoiceSettings();
  if (!s.reminderDays) return { sent: 0 };
  let sent = 0;
  for (const i of listInvoices()) {
    if (i.status !== 'offen' || isCredit(i) || !i.sentAt || amountDue(i) <= 0) continue;
    const last = i.reminders?.length ? Date.parse(i.reminders[i.reminders.length - 1]) : 0;
    const dueAt = dueDate(i).getTime() + s.reminderDays * 864e5;
    if (Date.now() < dueAt || (i.reminders?.length ?? 0) >= 2 || (last && Date.now() - last < 7 * 864e5)) continue;
    try { await sendInvoice(i, 'erinnerung'); sent++; } catch (e) { console.error('Zahlungserinnerung fehlgeschlagen', i.no, e); }
  }
  return { sent };
}
export const loadInvoice = getInvoice;

/** Beleg an die Buchhaltung: Kopie per E-Mail (Beleg-Adresse von lexoffice, sevDesk, DATEV Upload Mail …) */
export async function forwardToBookkeeping(i: Invoice) {
  const s = invoiceSettings();
  if (!i.no || !s.bookkeepingEmail) throw new Error('Keine Buchhaltungs-E-Mail hinterlegt.');
  const pdf = archivedPdf(i), xml = archivedXml(i);
  const ok = await sendMail({ to: s.bookkeepingEmail, subject: `Beleg ${i.no} – ${kindLabel(i)} – ${i.buyer.company || i.buyer.name}`, html: `<p>${kindLabel(i)} ${i.no} vom ${fmt(i.date)} über ${eur(invoiceTotals(i).gross)}.</p>`,
    attachments: [...(pdf ? [{ filename: `${i.no}.pdf`, content: pdf }] : []), ...(xml ? [{ filename: `${i.no}-xrechnung.xml`, content: xml }] : [])] });
  if (!ok) throw new Error('E-Mail-Versand ist nicht eingerichtet.');
  i.exported = { ...(i.exported ?? {}), mail: new Date().toISOString() }; invHistory(i, `An Buchhaltung gesendet (${s.bookkeepingEmail})`); saveInvoice(i);
}
/** Beleg direkt an Lexware Office (lexoffice) übertragen – landet dort unter „Belege“ */
export async function uploadToLexoffice(i: Invoice) {
  const s = invoiceSettings();
  if (!i.no || !s.lexofficeKey) throw new Error('Kein Lexware-Office-API-Schlüssel hinterlegt.');
  const pdf = archivedPdf(i);
  if (!pdf) throw new Error('PDF nicht gefunden.');
  let last = '';
  for (const base of [process.env.LEXOFFICE_API_BASE, 'https://api.lexware.io', 'https://api.lexoffice.io'].filter(Boolean) as string[]) {
    const fd = new FormData();
    fd.append('file', new Blob([pdf], { type: 'application/pdf' }), `${i.no}.pdf`);
    fd.append('type', 'voucher');
    const r = await fetch(`${base}/v1/files`, { method: 'POST', headers: { Authorization: `Bearer ${s.lexofficeKey}`, Accept: 'application/json' }, body: fd }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }) as any);
    if (r.ok) { i.exported = { ...(i.exported ?? {}), lexoffice: new Date().toISOString() }; invHistory(i, 'An Lexware Office übertragen'); saveInvoice(i); return; }
    last = `${r.status} ${(await r.text()).slice(0, 200)}`;
    if (r.status === 401 || r.status === 403) break;
  }
  throw new Error(`Lexware Office: ${last}`);
}
/** nach dem Festschreiben automatisch weitergeben (wenn eingestellt) */
export async function autoExport(i: Invoice) {
  const s = invoiceSettings();
  if (s.autoForward && s.bookkeepingEmail) await forwardToBookkeeping(i).catch((e) => invHistory(i, `Weiterleitung fehlgeschlagen: ${e.message}`));
  if (s.lexofficeAuto && s.lexofficeKey) await uploadToLexoffice(i).catch((e) => { invHistory(i, `Lexware Office fehlgeschlagen: ${e.message}`); saveInvoice(i); });
}

/** (Teil-)Gutschrift zu einer Rechnung: Entwurf mit allen Positionen (Menge 0) + freie Zeile für Preisnachlass */
export function newCredit(orig: Invoice): Invoice {
  if (!orig.no || isCredit(orig) || orig.status === 'storniert') throw new Error('Gutschriften sind nur zu festgeschriebenen, nicht stornierten Rechnungen möglich.');
  if (creditable(orig) <= 0) throw new Error('Diese Rechnung ist bereits vollständig gutgeschrieben.');
  const c: Invoice = { ...orig, id: randomIdInv(), no: null, kind: 'gutschrift', status: 'entwurf', token: randomIdInv(16), date: new Date().toISOString().slice(0, 10), refNo: orig.no, stornoNo: null, prepaid: [], credits: [],
    lines: [...orig.lines.map((l) => ({ ...l, qty: 0 })), ...(orig.shipping ? [{ text: 'Versand', qty: 0, unit: 'Pausch', price: orig.shipping }] : []), { text: 'Preisnachlass', detail: 'Grund: ', qty: 0, unit: 'Pausch', price: 0 }],
    shipping: 0, note: '', settleNote: null, seller: null, createdAt: new Date().toISOString(), finalizedAt: null, sentAt: null, paidAt: null, paidAmount: null, reminders: [], exported: {},
    history: [{ date: new Date().toISOString(), text: `Gutschrift-Entwurf zu ${orig.no}` }] };
  saveInvoice(c);
  return c;
}
