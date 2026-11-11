import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { saveText } from '@/lib/content';
import { getProduct } from '@/lib/catalog';

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const { id, text } = await req.json().catch(() => ({}));
  if (!getProduct(String(id))) return NextResponse.json({ error: 'Artikel nicht gefunden.' }, { status: 404 });
  if (text === null) { saveText(id, null); return NextResponse.json({ ok: true }); }
  const t = {
    headline: String(text?.headline ?? '').trim().slice(0, 80),
    intro: String(text?.intro ?? '').replace(/\r/g, '').trim().slice(0, 2500),
    highlights: (Array.isArray(text?.highlights) ? text.highlights : []).map((x: unknown) => String(x).trim().slice(0, 140)).filter(Boolean).slice(0, 8),
    idealFor: String(text?.idealFor ?? '').trim().slice(0, 200),
  };
  if (!t.headline || !t.intro) return NextResponse.json({ error: 'Überschrift und Einleitung sind Pflicht.' }, { status: 400 });
  saveText(id, t);
  return NextResponse.json({ ok: true });
}
