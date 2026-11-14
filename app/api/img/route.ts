import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** Verkleinerte WebP-Fassung von Artikelbildern (L-Shop-Bilder und lokale /p/-Bilder), auf der Platte zwischengespeichert.
 *  Nur feste Breiten und nur erlaubte Quellen – kein offener Proxy. */
const WIDTHS = [240, 480, 720, 1000];
const HOSTS = ['shop.l-shop-team.de'];
const DIR = path.join(DATA, 'imgcache');
const PUB = path.join(process.cwd(), 'public');
const busy = new Map<string, Promise<Buffer | null>>();

async function load(u: string): Promise<Buffer | null> {
  if (u.startsWith('/p/') || u.startsWith('/brands/')) {
    const f = path.normalize(path.join(PUB, decodeURIComponent(u.split('?')[0])));
    if (!f.startsWith(PUB + path.sep) || !fs.existsSync(f)) return null;
    return fs.readFileSync(f);
  }
  let url: URL; try { url = new URL(u); } catch { return null; }
  if (url.protocol !== 'https:' || !HOSTS.includes(url.hostname)) return null;
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) }).catch(() => null);
  if (!r?.ok || !/^image\//.test(r.headers.get('content-type') ?? '')) return null;
  const b = Buffer.from(await r.arrayBuffer());
  return b.length > 25e6 ? null : b;
}

async function make(u: string, w: number, file: string): Promise<Buffer | null> {
  const src = await load(u);
  if (!src) return null;
  try {
    const sharp = (await import('sharp')).default;
    const out = await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toBuffer();
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(file, out);
    return out;
  } catch { return null; }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const u = q.get('u') ?? '';
  const w = WIDTHS.find((x) => x >= Number(q.get('w') || 480)) ?? 1000;
  if (!u || u.length > 500 || u.includes('..') || !(/^\/(p|brands)\//.test(u) || HOSTS.some((h) => u.startsWith(`https://${h}/`)))) return new Response('Nicht gefunden', { status: 404 });
  const key = crypto.createHash('sha1').update(u).digest('hex');
  const file = path.join(DIR, `${key}-${w}.webp`);
  let data: Buffer | null = fs.existsSync(file) ? fs.readFileSync(file) : null;
  if (!data) {
    const k = `${key}-${w}`;
    if (!busy.has(k)) busy.set(k, make(u, w, file).finally(() => busy.delete(k)));
    data = await busy.get(k)!;
  }
  // Fallback: Original ausliefern lassen
  if (!data) return new Response(null, { status: 302, headers: { Location: u } });
  return new Response(data, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=2592000, immutable', 'X-Content-Type-Options': 'nosniff' } });
}
