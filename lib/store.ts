import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const DATA = path.join(process.cwd(), 'data');
export const UPLOADS = path.join(DATA, 'uploads');
const INQ = path.join(DATA, 'anfragen');

export function readJSON<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
export function writeJSON(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
export const randomId = (bytes = 12) => crypto.randomBytes(bytes).toString('hex');

/* ---------- Kunden (Zugangscodes) ---------- */
export type Customer = {
  code: string;
  name: string;
  /** Aufschlag in % – leer = Standard (MARKUP_PERCENT) */
  markup?: number | null;
  /** Artikelnummern der Kundenkollektion */
  skus?: string[];
  /** true = Kunde sieht NUR seine Kollektion */
  exclusive?: boolean;
  /** hinterlegtes Logo (Upload-ID) */
  logoId?: string | null;
  logoName?: string | null;
  note?: string;
  active?: boolean;
};
const CUST = path.join(DATA, 'kunden.json');

/** Codes aus .env (ACCESS_CODES=CODE:Name,…) – zusätzlich zu den im Admin angelegten */
function envCustomers(): Customer[] {
  return (process.env.ACCESS_CODES ?? '').split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
    const [code, ...rest] = x.split(':');
    return { code: code.trim().toUpperCase(), name: rest.join(':').trim() || code.trim().toUpperCase(), active: true };
  });
}
export function fileCustomers(): Customer[] { return readJSON<Customer[]>(CUST, []); }
export function saveCustomers(list: Customer[]) { writeJSON(CUST, list); }
export function allCustomers(): (Customer & { source: 'admin' | 'env' })[] {
  const file = fileCustomers().map((c) => ({ ...c, source: 'admin' as const }));
  const env = envCustomers().filter((e) => !file.some((f) => f.code === e.code)).map((c) => ({ ...c, source: 'env' as const }));
  return [...file, ...env];
}
export const findCustomer = (code: string) => allCustomers().find((c) => c.code === code.toUpperCase() && c.active !== false) ?? null;

/* ---------- Anfragen / Angebote ---------- */
import type { Deco } from './deco';
export type { Deco };
export type InqLine = { id?: string; sku: string; name: string; color: string; size: string; qty: number; price: number | null; sum: number; deco?: Deco | null };
export type OfferLine = { text: string; detail?: string; qty: number; price: number };
export type Offer = { lines: OfferLine[]; shipping: number; note: string; validDays: number; createdAt: string; sentAt?: string | null; vat: number };
export type Status = 'neu' | 'angebot' | 'angenommen' | 'bestellt' | 'geliefert' | 'abgelehnt';
export const STATUS: Record<Status, string> = { neu: 'Neu', angebot: 'Angebot gesendet', angenommen: 'Angenommen', bestellt: 'Bestellt', geliefert: 'Geliefert', abgelehnt: 'Abgelehnt' };
export type Inquiry = {
  no: string; date: string; zugangscode: string | null;
  customer: Record<string, string>; lines: InqLine[]; total: number;
  status?: Status; token?: string; offer?: Offer | null;
  history?: { date: string; text: string }[];
  acceptedAt?: string | null;
};

export function listInquiries(): Inquiry[] {
  if (!fs.existsSync(INQ)) return [];
  return fs.readdirSync(INQ).filter((f) => f.endsWith('.json'))
    .map((f) => readJSON<Inquiry | null>(path.join(INQ, f), null)).filter(Boolean)
    .map((i) => ({ ...i!, status: i!.status ?? 'neu' }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
export function getInquiry(no: string): Inquiry | null {
  if (!/^[A-Z0-9-]+$/.test(no)) return null;
  const i = readJSON<Inquiry | null>(path.join(INQ, `${no}.json`), null);
  return i ? { ...i, status: i.status ?? 'neu' } : null;
}
export function saveInquiry(i: Inquiry) { writeJSON(path.join(INQ, `${i.no}.json`), i); }
export function inquiryByToken(token: string) {
  if (!/^[a-f0-9]{32,}$/.test(token)) return null;
  return listInquiries().find((i) => i.token === token) ?? null;
}
export function addHistory(i: Inquiry, text: string) { i.history = [...(i.history ?? []), { date: new Date().toISOString(), text }]; }

/** Summen eines Angebots */
export function offerTotals(o: Offer) {
  const net = o.lines.reduce((s, l) => s + l.qty * l.price, 0) + (o.shipping || 0);
  const vat = Math.round(net * o.vat) / 100;
  return { net: Math.round(net * 100) / 100, vat, gross: Math.round((net + vat) * 100) / 100 };
}

/** Angebot aus der Anfrage vorbelegen (Shoppreise + Veredelung als eigene Position) */
export function draftOffer(i: Inquiry): Offer {
  const lines: OfferLine[] = i.lines.map((l) => ({ text: `${l.sku} ${l.name}`, detail: [l.color, l.size].filter(Boolean).join(', '), qty: l.qty, price: l.price ?? 0 }));
  const decos = new Map<string, { d: Deco; qty: number }>();
  for (const l of i.lines) if (l.deco) {
    const k = JSON.stringify(l.deco);
    const e = decos.get(k) ?? { d: l.deco, qty: 0 };
    e.qty += l.qty; decos.set(k, e);
  }
  for (const { d, qty } of decos.values()) lines.push({ text: `Veredelung: ${d.method}`, detail: d.positions.join(', '), qty, price: 0 });
  return { lines, shipping: 0, note: '', validDays: 14, createdAt: new Date().toISOString(), vat: Number(process.env.MWST_PERCENT ?? 19) };
}
