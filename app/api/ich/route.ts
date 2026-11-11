import { NextResponse } from 'next/server';
import { getCustomer } from '@/lib/customer';
/** Name des angemeldeten Kunden (für vorausgefüllte Formulare) */
export async function GET() {
  const c = await getCustomer();
  return NextResponse.json({ company: c?.name ?? '' }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export const dynamic = 'force-dynamic';
