import { NextResponse } from 'next/server';
import { didYouMean, search } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') ?? '').slice(0, 100);
  const limit = Math.min(Number(u.searchParams.get('limit') ?? 8), 50);
  const ctx = await getCustomer();
  const all = search(q, 200, ctx);
  return NextResponse.json({ total: all.length, items: all.slice(0, limit), suggest: all.length ? null : didYouMean(q, ctx) }, { headers: { 'Cache-Control': 'private, max-age=60' } });
}
