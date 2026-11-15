import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { hmac } from './access';

/** Druckdateien für Motivartikel (seed/druck/<kollektion>.json: Art.-Nr. → Dateiname) – nicht öffentlich, nur per signiertem Link */
export const DRUCK = path.join(process.cwd(), 'seed', 'druck');
let cache: Record<string, string> | null = null;
function manifest(): Record<string, string> {
  if (cache) return cache;
  const m: Record<string, string> = {};
  try { for (const f of fs.readdirSync(DRUCK).filter((x) => x.endsWith('.json'))) Object.assign(m, JSON.parse(fs.readFileSync(path.join(DRUCK, f), 'utf8'))); } catch {}
  return (cache = Object.fromEntries(Object.entries(m).map(([k, v]) => [k.toUpperCase(), v])));
}
export const printFileFor = (sku: string) => manifest()[String(sku ?? '').toUpperCase()] ?? null;
const key = () => `${process.env.ACCESS_SECRET ?? ''}|${process.env.ADMIN_PASSWORD ?? ''}|druck`;
const sig = (sku: string) => hmac(`druck|${sku.toUpperCase()}`, key()).then((h) => h.slice(0, 32));
/** Download-Link (relativ) zur Druckdatei – null, wenn der Artikel keine hat */
export async function printUrl(sku: string) { return printFileFor(sku) ? `/api/druck/${encodeURIComponent(sku.toUpperCase())}?k=${await sig(sku)}` : null; }
export async function checkPrint(sku: string, k: string | null) { return !!printFileFor(sku) && !!k && (await sig(sku)) === k; }
