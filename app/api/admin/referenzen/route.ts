import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { randomId, saveContactPerson, saveReferences, type Reference } from '@/lib/store';

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => null);
  const list: Reference[] = (Array.isArray(b?.refs) ? b.refs : []).slice(0, 60).map((r: any) => ({
    id: /^[a-f0-9]{8,24}$/.test(String(r.id ?? '')) ? String(r.id) : randomId(6),
    title: String(r.title ?? '').trim().slice(0, 120), text: String(r.text ?? '').trim().slice(0, 600), tag: String(r.tag ?? '').trim().slice(0, 40),
    imageId: /^[a-f0-9]{24}$/.test(String(r.imageId ?? '')) ? String(r.imageId) : null, imageName: String(r.imageName ?? '').slice(0, 120) || null, match: String(r.match ?? '').trim().slice(0, 300) || undefined,
  })).filter((r: Reference) => r.title);
  if (b?.contact !== undefined) {
    const c = b.contact, t = (x: unknown, n: number) => String(x ?? '').trim().slice(0, n);
    saveContactPerson(c && t(c.name, 80) ? { name: t(c.name, 80), role: t(c.role, 80), phone: t(c.phone, 40), email: t(c.email, 120), text: t(c.text, 300), hours: t(c.hours, 80), photoId: /^[a-f0-9]{24}$/.test(String(c.photoId ?? '')) ? String(c.photoId) : null } : null);
    if (!Array.isArray(b?.refs)) return NextResponse.json({ ok: true });
  }
  saveReferences(list);
  return NextResponse.json({ ok: true });
}
