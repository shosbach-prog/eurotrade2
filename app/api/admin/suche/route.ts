import { NextResponse } from 'next/server';
import { clearMiss } from '@/lib/search-log';

/** Suchbegriff(e) ohne Treffer als erledigt markieren: { q } oder {} = alle */
export async function DELETE(req: Request) {
  const b = await req.json().catch(() => ({}));
  clearMiss(typeof b?.q === 'string' ? b.q : undefined);
  return NextResponse.json({ ok: true });
}
