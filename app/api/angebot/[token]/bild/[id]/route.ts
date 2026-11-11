import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS, inquiryByToken, readJSON } from '@/lib/store';

const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf' };

/** Vorschau- und Freigabebilder zu einem Angebot – nur über den geheimen Angebotslink abrufbar */
export function GET(_req: Request, { params }: { params: { token: string; id: string } }) {
  const i = inquiryByToken(params.token);
  const ok = i && /^[a-f0-9]{24}$/.test(params.id) && (i.lines.some((l) => l.deco?.previews?.includes(params.id)) || i.proof?.ids.some((x) => x.id === params.id));
  if (!ok) return new Response('Nicht gefunden', { status: 404 });
  const meta = readJSON<{ ext: string; name: string } | null>(path.join(UPLOADS, `${params.id}.json`), null);
  const file = meta && path.join(UPLOADS, `${params.id}.${meta.ext}`);
  if (!meta || !TYPES[meta.ext] || !file || !fs.existsSync(file)) return new Response('Nicht gefunden', { status: 404 });
  return new Response(fs.readFileSync(file), { headers: { 'Content-Type': TYPES[meta.ext], 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(meta.name)}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=86400' } });
}
