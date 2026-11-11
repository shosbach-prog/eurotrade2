import 'server-only';
import { fileCustomers, normEmail, saveCustomers, type Customer } from './store';
import { parseTiers, tiersToString } from './tiers';

/** Eingaben aus dem Admin bereinigen (Passwort-Hash kommt NIE vom Browser) */
export function cleanCustomer(c: any): Customer {
  return {
    code: String(c?.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40),
    name: String(c?.name ?? '').trim().slice(0, 120),
    markup: c?.markup === '' || c?.markup == null || !Number.isFinite(Number(c.markup)) ? null : Math.max(0, Math.min(500, Number(c.markup))),
    tiers: (() => { const t = String(c?.tiers ?? '').trim(); return t === '-' ? '-' : t ? tiersToString(parseTiers(t)) || null : null; })(),
    skus: (Array.isArray(c?.skus) ? c.skus : []).map((s: unknown) => String(s).trim().toUpperCase()).filter(Boolean).slice(0, 500),
    exclusive: !!c?.exclusive,
    logoId: /^[a-f0-9]{24}$/.test(String(c?.logoId ?? '')) ? String(c.logoId) : null,
    logoName: c?.logoId ? String(c.logoName ?? '').slice(0, 120) : null,
    note: String(c?.note ?? '').slice(0, 2000),
    active: c?.active !== false,
    email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normEmail(c?.email)) ? normEmail(c.email) : null,
  };
}

/** Einen Kunden anlegen/ändern – Passwort, Registrier-Status und Datum bleiben erhalten */
export function saveOne(input: any, orig?: string | null): { ok: true; customer: Customer; activated: boolean } | { ok: false; error: string } {
  const c = cleanCustomer(input);
  if (!c.name) return { ok: false, error: 'Bitte einen Namen angeben.' };
  if (c.code.length < 4) return { ok: false, error: 'Der Zugangscode braucht mindestens 4 Zeichen (A–Z, 0–9, -).' };
  const list = fileCustomers();
  const i = orig ? list.findIndex((x) => x.code === String(orig).toUpperCase()) : -1;
  if (list.some((x, n) => n !== i && x.code === c.code)) return { ok: false, error: `Der Code ${c.code} ist schon vergeben.` };
  if (c.email && list.some((x, n) => n !== i && normEmail(x.email) === c.email)) return { ok: false, error: `Die E-Mail ${c.email} gehört schon zu einem anderen Kunden.` };
  const prev = i >= 0 ? list[i] : null;
  const out: Customer = {
    ...c,
    pw: prev?.pw && normEmail(prev.email) === c.email ? prev.pw : null, // neue E-Mail = Passwort neu festlegen
    pending: !!prev?.pending && !c.active,
    createdAt: prev?.createdAt ?? new Date().toISOString(),
  };
  if (i >= 0) list[i] = out; else list.unshift(out);
  saveCustomers(list);
  return { ok: true, customer: out, activated: !!prev?.pending && c.active !== false };
}
