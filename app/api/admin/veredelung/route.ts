import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { savePricing } from '@/lib/deco-pricing-store';

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const d = await req.json().catch(() => null);
  if (!d) return NextResponse.json({ error: 'Ungültige Daten.' }, { status: 400 });
  return NextResponse.json({ ok: true, pricing: savePricing(d) });
}
