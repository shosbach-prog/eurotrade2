import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { checkApiKey } from '@/lib/api-keys';
import { adminProduct, adminProducts } from '@/lib/catalog';
import { readOverrides, saveOverride, type Override } from '@/lib/artikel';
import { clean, cleanExtra, str } from '@/lib/artikel-input';
import { productPath } from '@/lib/format';
import { KOLLEKTIONEN } from '@/lib/kollektionen';
import { DATA, UPLOADS, randomId, readJSON, writeJSON } from '@/lib/store';
import type { Product } from '@/lib/types';

/**
 * Shop-API: eigene Artikel anlegen, ändern, abrufen, löschen.
 * Anmeldung: Header „Authorization: Bearer <schlüssel>“ oder „X-Api-Key: <schlüssel>“ (Schlüssel im Admin unter System → Shop-API).
 * Doku: docs/API.md
 */
export const dynamic = 'force-dynamic';
const MAX_ITEMS = 500;
const IMG_MAX = 15 * 1024 * 1024;
const IMG_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const IMG_CACHE = path.join(DATA, 'api-bilder.json'); // Quell-URL → hochgeladenes Bild (kein Doppel-Download bei Updates)
const SHOP = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');

const deny = () => NextResponse.json({ error: 'Kein gültiger API-Schlüssel. Header „Authorization: Bearer <schlüssel>“ senden.' }, { status: 401 });
const bySku = (sku: string) => { const s = sku.toUpperCase(); return adminProducts().find((p) => p.sku.toUpperCase() === s) ?? null; };
const out = (p: Product) => ({
  id: p.id, sku: p.sku, name: p.name, category: p.category, collection: p.collection ?? null, hidden: !!p.hidden, custom: !!p.custom,
  basePrice: p.basePrice ?? null, fixedGross: p.fixedGross ?? null, images: p.images, colors: p.colors.map((c) => c.name), sizes: p.sizes,
  url: `${SHOP}${productPath(p)}`, slug: p.slug ?? null,
});

/** Externes Bild in den Shop übernehmen (kein Hotlinking) → /api/bild/<id> */
async function mirror(url: string, cache: Record<string, string>): Promise<string> {
  if (!/^https:\/\//.test(url) || url.startsWith(SHOP)) return url.startsWith(SHOP) ? url.slice(SHOP.length) : url;
  if (cache[url]) return cache[url];
  const r = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'follow' });
  if (!r.ok) throw new Error(`Bild ${url} nicht abrufbar (HTTP ${r.status})`);
  const ext = IMG_TYPES[(r.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()];
  if (!ext) throw new Error(`Bild ${url}: nur PNG, JPG oder WebP`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > IMG_MAX) throw new Error(`Bild ${url}: größer als 15 MB`);
  const id = randomId();
  fs.mkdirSync(UPLOADS, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS, `${id}.${ext}`), buf);
  writeJSON(path.join(UPLOADS, `${id}.json`), { name: path.basename(new URL(url).pathname) || `bild.${ext}`, ext, size: buf.length, date: new Date().toISOString(), source: 'api' });
  return (cache[url] = `/api/bild/${id}`);
}

type Result = { sku: string; status: 'created' | 'updated' | 'unchanged' | 'error'; id?: string; url?: string; hidden?: boolean; error?: string; dryRun?: boolean };

async function upsert(input: Record<string, unknown>, opts: { mirror: boolean; dryRun: boolean }, cache: Record<string, string>): Promise<Result> {
  const sku = str(input.sku, 40);
  if (!sku) return { sku: '', status: 'error', error: 'sku fehlt' };
  const existing = bySku(sku);
  if (existing && !existing.custom) return { sku, status: 'error', id: existing.id, error: 'Katalogartikel (Lieferant) – über die API nicht änderbar' };
  const prev = existing ? readOverrides()[existing.id] ?? {} : null;
  const merged: Record<string, unknown> = { ...(prev ?? {}), ...input, sku };
  if (!str(merged.name, 120)) return { sku, status: 'error', error: 'name fehlt' };
  // Neue Artikel sind Entwürfe, solange nicht ausdrücklich hidden: false gesendet wird
  merged.hidden = typeof input.hidden === 'boolean' ? input.hidden : prev ? !!prev.hidden : true;
  if ('collection' in input && input.collection != null && !KOLLEKTIONEN[String(input.collection)]) return { sku, status: 'error', error: `collection unbekannt (erlaubt: ${Object.keys(KOLLEKTIONEN).join(', ')})` };
  try {
    if (opts.mirror && !opts.dryRun) {
      if (Array.isArray(merged.images)) merged.images = await Promise.all((merged.images as unknown[]).map((u) => mirror(String(u), cache)));
      if (Array.isArray(merged.colors)) merged.colors = await Promise.all((merged.colors as Record<string, unknown>[]).map(async (c) => ({ ...c, ...(c?.image ? { image: await mirror(String(c.image), cache) } : {}), ...(Array.isArray(c?.images) ? { images: await Promise.all((c.images as unknown[]).map((u) => mirror(String(u), cache))) } : {}) })));
    }
  } catch (e) { return { sku, status: 'error', error: (e as Error).message }; }
  const c = clean(merged), extra = cleanExtra(merged);
  const collection = input.collection === null ? undefined : (merged.collection as string | undefined);
  const next = { ...extra, ...c, custom: true, ...(collection ? { collection } : {}) } as Override;
  const id = existing?.id ?? `a-${randomId(4)}`;
  if (prev) { const { updatedAt: _u, ...p0 } = prev as Override; if (JSON.stringify(p0) === JSON.stringify(next)) return { sku, status: 'unchanged', id, hidden: !!next.hidden, url: `${SHOP}${productPath(existing!)}` }; }
  if (opts.dryRun) return { sku, status: existing ? 'updated' : 'created', id, hidden: !!next.hidden, dryRun: true };
  saveOverride(id, next);
  const p = adminProduct(id).p;
  return { sku, status: existing ? 'updated' : 'created', id, hidden: !!next.hidden, url: p ? `${SHOP}${productPath(p)}` : undefined };
}

/** Artikel abrufen: ?sku=…  ·  ?q=…  ·  ?collection=…  ·  ?custom=1  ·  ?limit=100&offset=0 */
export async function GET(req: Request) {
  if (!checkApiKey(req)) return deny();
  const q = new URL(req.url).searchParams;
  if (q.get('sku')) { const p = bySku(q.get('sku')!); return p ? NextResponse.json({ item: out(p) }) : NextResponse.json({ error: 'Artikel nicht gefunden.' }, { status: 404 }); }
  const term = (q.get('q') ?? '').toLowerCase(), coll = q.get('collection'), own = q.get('custom') === '1';
  const limit = Math.max(1, Math.min(500, Number(q.get('limit')) || 100)), offset = Math.max(0, Number(q.get('offset')) || 0);
  const list = adminProducts().filter((p) => (!own || p.custom) && (!coll || p.collection === coll) && (!term || `${p.sku} ${p.name}`.toLowerCase().includes(term)));
  return NextResponse.json({ total: list.length, limit, offset, items: list.slice(offset, offset + limit).map(out) });
}

/** Anlegen oder ändern (Abgleich über sku). Body: ein Artikel, ein Array oder { items: [...] }.  ?dry_run=1 prüft nur.  ?mirror_images=0 übernimmt Bild-URLs ohne Kopie. */
export async function POST(req: Request) {
  if (!checkApiKey(req)) return deny();
  const q = new URL(req.url).searchParams;
  const body = await req.json().catch(() => null);
  const items: unknown[] = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : body && typeof body === 'object' ? [body] : [];
  if (!items.length) return NextResponse.json({ error: 'Kein Artikel im Body (JSON-Objekt, Array oder { items: [...] }).' }, { status: 400 });
  if (items.length > MAX_ITEMS) return NextResponse.json({ error: `Höchstens ${MAX_ITEMS} Artikel pro Aufruf.` }, { status: 400 });
  const opts = { mirror: q.get('mirror_images') !== '0', dryRun: q.get('dry_run') === '1' };
  const cache = readJSON<Record<string, string>>(IMG_CACHE, {});
  const results: Result[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const sku = str((it as Record<string, unknown>)?.sku, 40).toUpperCase();
    if (sku && seen.has(sku)) { results.push({ sku, status: 'error', error: 'sku doppelt im selben Aufruf' }); continue; }
    seen.add(sku);
    results.push(it && typeof it === 'object' ? await upsert(it as Record<string, unknown>, opts, cache) : { sku: '', status: 'error', error: 'kein Objekt' });
  }
  if (!opts.dryRun) writeJSON(IMG_CACHE, cache);
  const count = (s: Result['status']) => results.filter((r) => r.status === s).length;
  const errors = count('error');
  return NextResponse.json({ ok: errors === 0, created: count('created'), updated: count('updated'), unchanged: count('unchanged'), errors, ...(opts.dryRun ? { dryRun: true } : {}), results }, { status: errors && errors === results.length ? 400 : 200 });
}

/** Eigenen Artikel löschen: ?sku=…  (Katalogartikel nicht) – zum vorübergehenden Ausblenden stattdessen POST mit hidden: true */
export async function DELETE(req: Request) {
  if (!checkApiKey(req)) return deny();
  const sku = new URL(req.url).searchParams.get('sku') ?? '';
  const p = sku ? bySku(sku) : null;
  if (!p) return NextResponse.json({ error: 'Artikel nicht gefunden.' }, { status: 404 });
  if (!p.custom) return NextResponse.json({ error: 'Katalogartikel – über die API nicht löschbar.' }, { status: 400 });
  saveOverride(p.id, null);
  return NextResponse.json({ ok: true, sku: p.sku, id: p.id });
}
