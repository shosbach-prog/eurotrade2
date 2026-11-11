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
  /** eigene Staffel "10:5,50:10" – leer = Standard, "-" = keine */
  tiers?: string | null;
  /** Artikelnummern der Kundenkollektion */
  skus?: string[];
  /** true = Kunde sieht NUR seine Kollektion */
  exclusive?: boolean;
  /** hinterlegtes Logo (Upload-ID) */
  logoId?: string | null;
  logoName?: string | null;
  note?: string;
  active?: boolean;
  /** Login mit E-Mail + Passwort (zusätzlich zum Code) */
  email?: string | null;
  /** scrypt-Hash "salt:hash" – verlässt nie den Server */
  pw?: string | null;
  /** Selbst registriert, wartet auf Freigabe im Admin */
  pending?: boolean;
  createdAt?: string;
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
export const normEmail = (e: unknown) => String(e ?? '').trim().toLowerCase();
/** auch gesperrte/wartende Konten (für Registrierung + Login-Hinweis) */
export const anyCustomerByEmail = (email: string) => { const e = normEmail(email); return e ? fileCustomers().find((c) => normEmail(c.email) === e) ?? null : null; };
export const findCustomerByEmail = (email: string) => { const e = normEmail(email); return e ? fileCustomers().find((c) => normEmail(c.email) === e && c.active !== false) ?? null : null; };
/** Kunde ohne Passwort-Hash (für Admin-Oberfläche) */
export const publicCustomer = <T extends Customer>({ pw, ...c }: T) => ({ ...c, hasPw: !!pw });
export function updateCustomer(code: string, patch: Partial<Customer>) {
  const list = fileCustomers();
  const i = list.findIndex((c) => c.code === code);
  if (i < 0) return false;
  list[i] = { ...list[i], ...patch };
  saveCustomers(list);
  return true;
}
export const findCustomer = (code: string) => allCustomers().find((c) => c.code === code.toUpperCase() && c.active !== false) ?? null;

/* ---------- Anfragen / Angebote ---------- */
import { posLabel, decoText, type Deco } from './deco';
import { DEFAULT_PRICING, calcDeco, cleanPricing } from './deco-pricing';
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
  /** Willkommensrabatt aus dem Newsletter */
  discount?: { code: string; pct: number } | null;
  reviewRequestedAt?: string | null;
  /** Erinnerung zum Angebot gesendet */
  remindedAt?: string | null;
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
  // Veredelung nach Kalkulation (Admin → Veredelung); „Beratung gewünscht“ bleibt bei 0 zum Ausfüllen
  const raw = readJSON<unknown>(path.join(DATA, 'veredelung.json'), null);
  const pricing = raw ? cleanPricing(raw) : DEFAULT_PRICING;
  for (const { d, qty } of decos.values()) {
    const motiv = [d.logoName ? `Logo: ${d.logoName}` : '', decoText(d)].filter(Boolean).join(' · ');
    const calc = calcDeco(pricing, d.method, d.positions.map((pos) => ({ pos, cm: d.sizes?.[pos] ?? 10 })), qty);
    if (!calc) { lines.push({ text: `Veredelung: ${d.method}`, detail: [posLabel(d), motiv].filter(Boolean).join(' · '), qty, price: 0 }); continue; }
    for (const c of calc.lines) {
      lines.push({ text: `Veredelung ${calc.method}: ${c.pos}`, detail: [`ca. ${c.cm} cm (${c.size})${c.tooBig ? ' – größer als Tabelle, bitte prüfen' : ''}`, motiv].filter(Boolean).join(' · '), qty, price: c.unit });
      if (c.setup > 0) lines.push({ text: `${calc.method === 'Stick' ? pricing.stick.setupLabel : pricing.druck.setupLabel} einmalig: ${c.pos}`, detail: c.size, qty: 1, price: c.setup });
    }
    if (calc.minApplied > 0) lines.push({ text: 'Mindermengenzuschlag Veredelung', detail: `Mindestbetrag ${pricing.minOrder.toFixed(2).replace('.', ',')} €`, qty: 1, price: calc.minApplied });
  }
  if (i.discount?.pct) {
    const textil = i.lines.reduce((s, l) => s + l.sum, 0);
    lines.push({ text: `Willkommensrabatt ${i.discount.pct} %`, detail: `Code ${i.discount.code} · auf Textilien`, qty: 1, price: -Math.round(textil * i.discount.pct) / 100 });
  }
  return { lines, shipping: 0, note: '', validDays: 14, createdAt: new Date().toISOString(), vat: Number(process.env.MWST_PERCENT ?? 19) };
}

/* ---------- Referenzen (öffentlich auf der Startseite) ---------- */
export type Reference = { id: string; title: string; text: string; imageId?: string | null; imageName?: string | null; tag?: string };
const REFS = path.join(DATA, 'referenzen.json');
export const listReferences = () => readJSON<Reference[]>(REFS, []);
export const saveReferences = (r: Reference[]) => writeJSON(REFS, r);

/* ---------- Zugangsanfragen (von der Startseite) ---------- */
export type AccessRequest = { id: string; date: string; name: string; company: string; email: string; phone: string; type: string; message: string; done?: boolean;
  /** Preisanfrage ohne Zugang */ kind?: 'zugang' | 'preis'; category?: string; qty?: string; deco?: string; sample?: boolean; logoId?: string; logoName?: string };
const AREQ = path.join(DATA, 'zugangsanfragen.json');
export const listAccessRequests = () => readJSON<AccessRequest[]>(AREQ, []);
export const saveAccessRequests = (r: AccessRequest[]) => writeJSON(AREQ, r.slice(-1000));

/* ---------- Newsletter (Double-Opt-in) + Willkommensrabatt ---------- */
export type Subscriber = {
  id: string; email: string; type: string; date: string; token: string;
  confirmed: boolean; confirmedAt?: string | null; unsubscribedAt?: string | null;
  /** persönlicher Rabattcode – erst nach Bestätigung */
  code?: string | null; usedAt?: string | null; usedIn?: string | null;
};
const NL = path.join(DATA, 'newsletter.json');
export const listSubscribers = () => readJSON<Subscriber[]>(NL, []);
export const saveSubscribers = (l: Subscriber[]) => writeJSON(NL, l);
/** Rabattstufen: NEWSLETTER_TIERS="10:45,20:90,30:155" (Prozent:ab Netto-Warenwert) */
export function discountTiers(): { pct: number; min: number }[] {
  return (process.env.NEWSLETTER_TIERS ?? '10:45,20:90,30:155').split(',').map((x) => x.split(':').map(Number))
    .filter(([p, m]) => p > 0 && p < 90 && m >= 0).map(([pct, min]) => ({ pct, min })).sort((a, b) => a.min - b.min);
}
export const discountFor = (net: number) => [...discountTiers()].reverse().find((t) => net >= t.min)?.pct ?? 0;
/** gültiger, noch nicht eingelöster Code? */
export function validCode(code: string) {
  const c = String(code ?? '').trim().toUpperCase();
  if (!/^ET-[A-Z0-9]{6}$/.test(c)) return null;
  return listSubscribers().find((s) => s.code === c && s.confirmed && !s.unsubscribedAt && !s.usedAt) ?? null;
}

/* ---------- Bewertungen (nur verifizierte Käufer) ---------- */
export type Review = {
  id: string; productId: string | null; /** null = Bewertung des Shops/Services */
  sku?: string; productName?: string;
  name: string; company?: string; rating: number; title: string; text: string;
  date: string; inquiryNo: string; status: 'pending' | 'approved' | 'rejected'; reply?: string;
  /** wie die Bewertung zu uns kam (Formular = leer) */
  source?: 'formular' | 'email' | 'telefon' | 'persoenlich';
  /** Gegenleistung erhalten (z. B. kostenloses Testprodukt) – wird öffentlich gekennzeichnet */
  incentive?: string | null;
};
const REV = path.join(DATA, 'bewertungen.json');
export const listReviews = () => readJSON<Review[]>(REV, []);
export const saveReviews = (r: Review[]) => writeJSON(REV, r);
