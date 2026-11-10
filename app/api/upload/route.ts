import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS, randomId, writeJSON } from '@/lib/store';

const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf', ai: 'application/postscript', eps: 'application/postscript' };
const MAX = 15 * 1024 * 1024;
const hits = new Map<string, number[]>();

/** Logo-Upload (Kunden im Shop und Admin) */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (recent.length >= 20) return NextResponse.json({ error: 'Zu viele Uploads – bitte später erneut.' }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Keine Datei.' }, { status: 400 });
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!TYPES[ext]) return NextResponse.json({ error: 'Bitte PNG, JPG, SVG, PDF, AI oder EPS hochladen.' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'Datei ist größer als 15 MB.' }, { status: 400 });

  const id = randomId();
  fs.mkdirSync(UPLOADS, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS, `${id}.${ext}`), Buffer.from(await file.arrayBuffer()));
  const name = file.name.replace(/[^\w.\- äöüÄÖÜß()]/g, '_').slice(0, 120);
  writeJSON(path.join(UPLOADS, `${id}.json`), { name, ext, size: file.size, date: new Date().toISOString() });
  return NextResponse.json({ id, name, preview: ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext) });
}
