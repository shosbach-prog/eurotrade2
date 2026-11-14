import { NextResponse } from 'next/server';
import { getTeamShop, isDirectShop } from '@/lib/teamshop';
import { paypalEnabled } from '@/lib/paypal';
import { VAT } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

/** Warenkorb: Einstellungen eines Team-/Motiv-Shops (Einzelversand, Versand, PayPal) */
export function GET(req: Request) {
  const t = getTeamShop(new URL(req.url).searchParams.get('slug') ?? '');
  if (!t) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 });
  const direct = isDirectShop(t);
  return NextResponse.json({ slug: t.slug, name: t.name, direct, ship: direct ? t.shipGross ?? 0 : 0, freeFrom: direct ? t.freeFromGross ?? null : null, paypal: direct && paypalEnabled(), vat: VAT }, { headers: { 'Cache-Control': 'no-store' } });
}
