import { NextResponse } from 'next/server';
import { search } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') ?? '').slice(0, 100);
  const limit = Math.min(Number(u.searchParams.get('limit') ?? 8), 50);
  const all = search(q, 200);
  return NextResponse.json({ total: all.length, items: all.slice(0, limit) }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
