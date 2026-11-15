import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { createKey, publicKeys, revokeKey } from '@/lib/api-keys';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  return NextResponse.json({ keys: publicKeys() });
}
/** Neuen Schlüssel anlegen – Klartext kommt nur in dieser Antwort */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const k = createKey(String(b?.name ?? ''));
  return NextResponse.json({ ok: true, key: k.key, id: k.id });
}
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') ?? '';
  return revokeKey(id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Schlüssel nicht gefunden.' }, { status: 404 });
}
