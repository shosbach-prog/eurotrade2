import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS, readJSON } from '@/lib/store';
import { thumb, thumbWidth } from '@/lib/thumb';

const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf', ai: 'application/postscript', eps: 'application/postscript' };

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!/^[a-f0-9]{24}$/.test(params.id)) return new Response('Nicht gefunden', { status: 404 });
  const meta = readJSON<{ name: string; ext: string } | null>(path.join(UPLOADS, `${params.id}.json`), null);
  const file = meta && path.join(UPLOADS, `${params.id}.${meta.ext}`);
  if (!meta || !file || !fs.existsSync(file)) return new Response('Nicht gefunden', { status: 404 });
  const q = new URL(req.url).searchParams;
  const download = q.has('download');
  // ?w=320 → verkleinerte Vorschau (WebP), statt mehrere MB Original zu laden
  const w = Number(q.get('w'));
  if (!download && w > 0) {
    const t = await thumb(params.id, meta.ext, file, thumbWidth(w));
    if (t) return new Response(t.data, { headers: { 'Content-Type': t.type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=2592000, immutable' } });
  }
  return new Response(fs.readFileSync(file), {
    headers: {
      'Content-Type': TYPES[meta.ext] ?? 'application/octet-stream',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
      // Hochgeladene Dateien nie als aktive Seite ausführen (z. B. SVG mit Skript)
      'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=86400',
    },
  });
}
