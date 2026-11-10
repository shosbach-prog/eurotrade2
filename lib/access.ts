// Signierte Cookies für Kunden-Zugang und Admin – läuft in Middleware (Edge) und Node (Web Crypto)
export const ACCESS_COOKIE = 'et_access';
export const ADMIN_COOKIE = 'et_admin';
export const ACCESS_DAYS = 180;

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
const secret = () => process.env.ACCESS_SECRET || 'euro-trade';

export async function hmac(msg: string, key = secret()): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}

export const normCode = (c: string) => String(c ?? '').trim().toUpperCase();

/** Shop geschlossen? – SHOP_CLOSED=true oder Codes in ACCESS_CODES */
export const shopClosed = () => process.env.SHOP_CLOSED === 'true' || !!(process.env.ACCESS_CODES ?? '').trim();

/** Cookie-Wert: CODE.signatur */
export async function signCode(code: string) { const c = normCode(code); return `${encodeURIComponent(c)}.${await hmac('code|' + c)}`; }
export async function verifyCodeToken(token?: string | null): Promise<string | null> {
  if (!token) return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const code = decodeURIComponent(token.slice(0, i));
  return (await hmac('code|' + code)) === token.slice(i + 1) ? code : null;
}

/** Admin-Cookie: hängt am Passwort – Passwort ändern = alle Admin-Sitzungen ungültig */
export async function adminToken() { return hmac('admin|' + (process.env.ADMIN_PASSWORD ?? '')); }
export async function isAdminToken(token?: string | null) {
  return !!process.env.ADMIN_PASSWORD && !!token && token === (await adminToken());
}
