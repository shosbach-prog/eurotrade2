import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { cartAction } from '@/lib/cart-remind';

/** Gemerkte Warenkörbe: { id, action: approve | send | drop } */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht erlaubt.' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!['approve', 'send', 'drop'].includes(b?.action)) return NextResponse.json({ error: 'Ungültig.' }, { status: 400 });
  const err = await cartAction(String(b.id ?? ''), b.action);
  return err ? NextResponse.json({ error: err }, { status: 400 }) : NextResponse.json({ ok: true });
}
