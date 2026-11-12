import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { cleanKalk, saveKalk } from '@/lib/kalkulation';

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'Keine Daten.' }, { status: 400 });
  saveKalk(cleanKalk(b));
  return NextResponse.json({ ok: true });
}
