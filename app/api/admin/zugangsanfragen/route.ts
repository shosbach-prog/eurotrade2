import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { listAccessRequests, saveAccessRequests } from '@/lib/store';

/** Zugangsanfrage als erledigt markieren */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const { id, done } = await req.json().catch(() => ({}));
  saveAccessRequests(listAccessRequests().map((r) => (r.id === id ? { ...r, done: !!done } : r)));
  return NextResponse.json({ ok: true });
}
