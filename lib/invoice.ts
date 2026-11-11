import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { DATA, randomId, readJSON, writeJSON, type Inquiry } from './store';

/* ---------- Rechnungseinstellungen (Admin → Rechnungen → Einstellungen) ---------- */
export type InvoiceSettings = {
  company: string; owner: string; street: string; zip: string; city: string; country: string;
  phone: string; email: string; web: string;
  taxNo: string; vatId: string; iban: string; bic: string; bank: string;
  payDays: number; prefix: string; kleinunternehmer: boolean;
  /** automatische Zahlungserinnerung X Tage nach Fälligkeit (0 = aus) */
  reminderDays: number;
  footer: string;
  counter: Record<string, number>;
};
const SET = path.join(DATA, 'rechnung-einstellungen.json');
export const DEFAULT_SETTINGS: InvoiceSettings = {
  company: 'Euro-Trade', owner: 'Sebastian Hosbach', street: 'Seehang 28', zip: '44263', city: 'Dortmund', country: 'DE',
  phone: '0173 2648097', email: 'info@euro-trade.com', web: 'euro-trade.com',
  taxNo: '', vatId: '', iban: '', bic: '', bank: '', payDays: 14, prefix: 'RE-', kleinunternehmer: false, reminderDays: 7, footer: '', counter: {},
};
export const invoiceSettings = (): InvoiceSettings => ({ ...DEFAULT_SETTINGS, ...readJSON<Partial<InvoiceSettings>>(SET, {}) });
export function saveInvoiceSettings(s: Partial<InvoiceSettings>) { writeJSON(SET, { ...invoiceSettings(), ...s }); }
/** Was fehlt noch für eine gesetzeskonforme Rechnung (§ 14 UStG)? */
export function settingsMissing(s = invoiceSettings()) {
  const m: string[] = [];
  if (!s.company || !s.street || !s.zip || !s.city) m.push('Anschrift');
  if (!s.taxNo && !s.vatId) m.push('Steuernummer oder USt-IdNr.');
  if (!s.iban) m.push('IBAN');
  return m;
}

/* ---------- Rechnungen ---------- */
export type InvLine = { text: string; detail?: string; qty: number; unit: string; price: number };
export type Buyer = { company: string; name: string; street: string; zip: string; city: string; country: string; email: string; vatId?: string; reference?: string };
export type InvStatus = 'entwurf' | 'offen' | 'bezahlt' | 'storniert';
export const INV_STATUS: Record<InvStatus, string> = { entwurf: 'Entwurf', offen: 'Offen', bezahlt: 'Bezahlt', storniert: 'Storniert' };
export type Invoice = {
  id: string; no: string | null; kind: 'rechnung' | 'storno'; status: InvStatus;
  inquiryNo?: string | null; token: string;
  date: string; serviceDate: string; payDays: number;
  buyer: Buyer; lines: InvLine[]; shipping: number; vat: number; kleinunternehmer: boolean; note: string;
  /** Storno: Bezug auf die Originalrechnung */
  refNo?: string | null; stornoNo?: string | null;
  seller?: InvoiceSettings | null;
  createdAt: string; finalizedAt?: string | null; sentAt?: string | null; paidAt?: string | null; paidAmount?: number | null;
  reminders?: string[]; history?: { date: string; text: string }[];
};
const DIR = path.join(DATA, 'rechnungen');
const FILE = (id: string) => path.join(DIR, `${id}.json`);
export const invoicePdfPath = (no: string) => path.join(DIR, 'archiv', `${no}.pdf`);
export const invoiceXmlPath = (no: string) => path.join(DIR, 'archiv', `${no}.xml`);

export function listInvoices(): Invoice[] {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => readJSON<Invoice | null>(path.join(DIR, f), null)).filter((x): x is Invoice => !!x)
    .sort((a, b) => (b.finalizedAt ?? b.createdAt).localeCompare(a.finalizedAt ?? a.createdAt));
}
export const getInvoice = (id: string) => (/^[a-f0-9]{24}$/.test(id) ? readJSON<Invoice | null>(FILE(id), null) : null);
export const invoiceByToken = (t: string) => (/^[a-f0-9]{32}$/.test(t) ? listInvoices().find((i) => i.token === t && i.no) ?? null : null);
export const saveInvoice = (i: Invoice) => writeJSON(FILE(i.id), i);
export const invHistory = (i: Invoice, text: string) => { i.history = [...(i.history ?? []), { date: new Date().toISOString(), text }]; };

const r2 = (n: number) => Math.round(n * 100) / 100;
export function invoiceTotals(i: Pick<Invoice, 'lines' | 'shipping' | 'vat' | 'kleinunternehmer'>) {
  const net = r2(i.lines.reduce((s, l) => s + r2(l.qty * l.price), 0) + (i.shipping || 0));
  const rate = i.kleinunternehmer ? 0 : i.vat;
  const vat = r2((net * rate) / 100);
  return { net, rate, vat, gross: r2(net + vat) };
}
export const dueDate = (i: Pick<Invoice, 'date' | 'payDays'>) => new Date(Date.parse(i.date) + i.payDays * 864e5);
export const isOverdue = (i: Invoice) => i.status === 'offen' && i.kind === 'rechnung' && Date.now() > dueDate(i).getTime() + 864e5;

/** Rechnungsadresse aus der Anfrage (PLZ aus „44263 Dortmund“) */
export function buyerFromInquiry(q: Inquiry): Buyer {
  const c = q.customer;
  const m = /^\s*(\d{4,5})\s+(.+)$/.exec(c.city ?? '');
  return { company: c.company ?? '', name: c.name ?? '', street: c.street ?? '', zip: m?.[1] ?? c.zip ?? '', city: m?.[2] ?? c.city ?? '', country: 'DE', email: c.email ?? '', reference: q.no };
}
export function newInvoice(from?: Inquiry | null): Invoice {
  const s = invoiceSettings();
  const o = from?.offer;
  const lines: InvLine[] = (o?.lines ?? []).map((l) => ({ text: l.text, detail: l.detail, qty: l.qty, unit: 'Stk', price: l.price }));
  return {
    id: randomId(12), no: null, kind: 'rechnung', status: 'entwurf', inquiryNo: from?.no ?? null, token: randomId(16),
    date: new Date().toISOString().slice(0, 10), serviceDate: new Date().toISOString().slice(0, 10), payDays: s.payDays,
    buyer: from ? buyerFromInquiry(from) : { company: '', name: '', street: '', zip: '', city: '', country: 'DE', email: '' },
    lines: lines.length ? lines : [{ text: '', qty: 1, unit: 'Stk', price: 0 }], shipping: o?.shipping ?? 0,
    vat: s.kleinunternehmer ? 0 : o?.vat ?? Number(process.env.MWST_PERCENT ?? 19), kleinunternehmer: s.kleinunternehmer,
    note: '', createdAt: new Date().toISOString(), history: [{ date: new Date().toISOString(), text: from ? `Entwurf aus Angebot ${from.no}` : 'Entwurf angelegt' }],
  };
}
/** Fortlaufende Rechnungsnummer je Jahr: RE-2026-0001 – wird nur beim Festschreiben vergeben, nie doppelt */
export function nextNumber(year = new Date().getFullYear()) {
  const s = invoiceSettings();
  const used = new Set(listInvoices().map((i) => i.no).filter(Boolean));
  let n = (s.counter[year] ?? 0) + 1, no = '';
  do { no = `${s.prefix}${year}-${String(n).padStart(4, '0')}`; n++; } while (used.has(no));
  saveInvoiceSettings({ counter: { ...s.counter, [year]: n - 1 } });
  return no;
}
export const randomIdInv = (n = 12) => randomId(n);
