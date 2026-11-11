import { NextResponse } from 'next/server';
import { discountTiers, validCode } from '@/lib/store';
/** Rabattcode prüfen (Warenkorb) */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code') ?? '';
  const ok = !!validCode(code);
  return NextResponse.json({ ok, tiers: ok ? discountTiers() : [] }, { headers: { 'Cache-Control': 'no-store' } });
}
export const dynamic = 'force-dynamic';
