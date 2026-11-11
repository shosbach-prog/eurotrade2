import 'server-only';
import crypto from 'node:crypto';
import { hmac } from './access';

/** Passwort-Hash mit scrypt: "salt:hash" */
export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
export function verifyPassword(pw: string, stored?: string | null) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const a = Buffer.from(hash, 'hex'), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export const pwProblem = (pw: string) => (pw.length < 8 ? 'Das Passwort braucht mindestens 8 Zeichen.' : pw.length > 200 ? 'Das Passwort ist zu lang.' : null);

/** Link zum Passwort setzen/zurücksetzen: gültig 48 h und nur einmal (hängt am bisherigen Passwort-Hash) */
export async function resetToken(code: string, pwHash: string | null | undefined, hours = 48) {
  const exp = Date.now() + hours * 3600_000;
  const sig = await hmac(`reset|${code}|${exp}|${pwHash ?? ''}`);
  return `${Buffer.from(code).toString('base64url')}.${exp}.${sig}`;
}
export async function checkResetToken(token: string, lookup: (code: string) => { pw?: string | null } | null) {
  const [c, exp, sig] = String(token ?? '').split('.');
  if (!c || !exp || !sig || Number(exp) < Date.now()) return null;
  const code = Buffer.from(c, 'base64url').toString();
  const cust = lookup(code);
  if (!cust) return null;
  return (await hmac(`reset|${code}|${exp}|${cust.pw ?? ''}`)) === sig ? code : null;
}
