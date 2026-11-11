import 'server-only';
import { cookies, headers } from 'next/headers';
import { ACCESS_COOKIE, ADMIN_COOKIE, isAdminToken, previewMode, shopClosed, verifyCodeToken } from './access';
import { findCustomer, type Customer } from './store';

/** Angemeldeter Kunde (aus signiertem Cookie) – null, wenn kein/ungültiger/gesperrter Code */
export async function getCustomer(): Promise<Customer | null> {
  if (previewMode()) return null; // Vorschau: nur Admin
  const code = await verifyCodeToken(cookies().get(ACCESS_COOKIE)?.value);
  return code ? findCustomer(code) : null;
}
export async function isAdmin() { return isAdminToken(cookies().get(ADMIN_COOKIE)?.value); }

/** Schaufenster-Besucher (ohne Code): sieht Artikel, aber keine Preise */
export async function viewCtx() {
  const { ok, customer } = await shopAccess();
  if (ok) return customer;
  return headers().get('x-showcase') === '1' ? { locked: true as const } : null;
}

/** Darf der Besucher den Shop sehen? (offen, Kunde oder Admin) */
export async function shopAccess(): Promise<{ ok: boolean; customer: Customer | null }> {
  const customer = await getCustomer();
  if (!shopClosed() || customer) return { ok: true, customer };
  return { ok: await isAdmin(), customer: null };
}
