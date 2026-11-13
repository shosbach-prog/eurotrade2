import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { konditionen, type Kond } from '@/lib/konditionen';

export const dynamic = 'force-dynamic';

/** Einkaufskonditionen für die Admin-Sticker im Shop – POST { ids: string[] } */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(b?.ids) ? b.ids.map(String).slice(0, 500) : [];
  const out: Record<string, Kond | null> = {};
  const team = typeof b?.team === 'string' && /^[a-z0-9-]{1,40}$/.test(b.team) ? b.team : null;
  for (const id of ids) out[id] = konditionen(id, team);
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
