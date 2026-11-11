import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { cronKey, runFollowUps } from '@/lib/followup';

export const dynamic = 'force-dynamic';

/** Täglicher Lauf (Cron auf dem Server, mit Schlüssel aus data/cron-key) oder manuell als Admin */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key') ?? '';
  if (key !== cronKey() && !(await isAdmin())) return NextResponse.json({ error: 'Nicht erlaubt.' }, { status: 403 });
  const r = await runFollowUps();
  return NextResponse.json({ ok: true, ...r });
}
