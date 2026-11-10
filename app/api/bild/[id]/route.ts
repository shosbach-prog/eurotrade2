import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS, listReferences, readJSON } from '@/lib/store';

const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

/** Öffentliche Bilder – nur solche, die als Referenz freigegeben sind */
export function GET(_: Request, { params }: { params: { id: string } }) {
  if (!/^[a-f0-9]{24}$/.test(params.id) || !listReferences().some((r) => r.imageId === params.id)) return new Response('Nicht gefunden', { status: 404 });
  const meta = readJSON<{ ext: string } | null>(path.join(UPLOADS, `${params.id}.json`), null);
  const file = meta && path.join(UPLOADS, `${params.id}.${meta.ext}`);
  if (!meta || !TYPES[meta.ext] || !fs.existsSync(file!)) return new Response('Nicht gefunden', { status: 404 });
  return new Response(fs.readFileSync(file!), { headers: { 'Content-Type': TYPES[meta.ext], 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
}
