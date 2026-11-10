import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { randomId, saveReferences, type Reference } from '@/lib/store';

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => null);
  const list: Reference[] = (Array.isArray(b?.refs) ? b.refs : []).slice(0, 60).map((r: any) => ({
    id: /^[a-f0-9]{8,24}$/.test(String(r.id ?? '')) ? String(r.id) : randomId(6),
    title: String(r.title ?? '').trim().slice(0, 120), text: String(r.text ?? '').trim().slice(0, 600), tag: String(r.tag ?? '').trim().slice(0, 40),
    imageId: /^[a-f0-9]{24}$/.test(String(r.imageId ?? '')) ? String(r.imageId) : null, imageName: String(r.imageName ?? '').slice(0, 120) || null,
  })).filter((r: Reference) => r.title);
  saveReferences(list);
  return NextResponse.json({ ok: true });
}
