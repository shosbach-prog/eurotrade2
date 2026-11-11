import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { saveAnchor, type Anchor } from '@/lib/image-fit';

/** Admin: Lage des Motivs für ein Foto + Position speichern (oder löschen) */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => null);
  const src = String(b?.src ?? ''), pos = String(b?.pos ?? '').slice(0, 60);
  if (!/^(\/p\/|https:\/\/shop\.l-shop-team\.de\/)/.test(src) || !pos) return NextResponse.json({ error: 'Ungültig.' }, { status: 400 });
  const a = Array.isArray(b?.anchor) && b.anchor.length === 4 && b.anchor.every((n: unknown) => typeof n === 'number' && isFinite(n)) ? (b.anchor as Anchor) : null;
  saveAnchor(src, pos, a);
  return NextResponse.json({ ok: true });
}
