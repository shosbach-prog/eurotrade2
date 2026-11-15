import 'server-only';
import crypto from 'node:crypto';
import path from 'node:path';
import { DATA, readJSON, writeJSON } from './store';

/** API-Schlüssel für die Shop-API (/api/v1) – gespeichert nur als SHA-256-Hash, im Klartext nur einmal beim Anlegen sichtbar */
export type ApiKey = { id: string; name: string; hash: string; prefix: string; created: string; lastUsed?: string | null };
const FILE = path.join(DATA, 'api-keys.json');
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const listKeys = () => readJSON<ApiKey[]>(FILE, []);
export const publicKeys = () => listKeys().map(({ hash: _h, ...k }) => k);

export function createKey(name: string) {
  const key = `et_${crypto.randomBytes(24).toString('hex')}`;
  const k: ApiKey = { id: crypto.randomBytes(6).toString('hex'), name: name.slice(0, 80) || 'API-Schlüssel', hash: sha(key), prefix: key.slice(0, 10), created: new Date().toISOString(), lastUsed: null };
  writeJSON(FILE, [...listKeys(), k]);
  return { ...k, key };
}
export function revokeKey(id: string) {
  const all = listKeys();
  const next = all.filter((k) => k.id !== id);
  if (next.length === all.length) return false;
  writeJSON(FILE, next);
  return true;
}

/** Schlüssel aus „Authorization: Bearer …“ oder „X-Api-Key“ prüfen; zusätzlich SHOP_API_KEY aus der .env */
export function checkApiKey(req: Request): ApiKey | null {
  const h = req.headers.get('authorization') ?? '';
  const key = (h.toLowerCase().startsWith('bearer ') ? h.slice(7) : req.headers.get('x-api-key') ?? '').trim();
  if (!key || key.length < 20) return null;
  const env = process.env.SHOP_API_KEY;
  if (env && env.length >= 20 && key.length === env.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(env))) return { id: 'env', name: 'SHOP_API_KEY', hash: '', prefix: env.slice(0, 10), created: '' };
  const hk = Buffer.from(sha(key), 'hex');
  const all = listKeys();
  const hit = all.find((k) => { const b = Buffer.from(k.hash, 'hex'); return b.length === hk.length && crypto.timingSafeEqual(b, hk); });
  if (!hit) return null;
  // „zuletzt genutzt“ höchstens einmal pro Stunde schreiben
  if (!hit.lastUsed || Date.now() - Date.parse(hit.lastUsed) > 3600_000) { hit.lastUsed = new Date().toISOString(); writeJSON(FILE, all); }
  return hit;
}
