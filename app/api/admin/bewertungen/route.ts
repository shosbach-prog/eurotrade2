import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { listReviews, saveReviews } from '@/lib/store';

/** Bewertung freigeben/ablehnen/beantworten – Inhalte der Kunden werden nicht verändert */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const { id, status, reply } = await req.json().catch(() => ({}));
  const list = listReviews();
  const r = list.find((x) => x.id === id);
  if (!r) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 });
  if (['pending', 'approved', 'rejected'].includes(status)) r.status = status;
  if (typeof reply === 'string') r.reply = reply.trim().slice(0, 800) || undefined;
  saveReviews(list);
  return NextResponse.json({ ok: true });
}
