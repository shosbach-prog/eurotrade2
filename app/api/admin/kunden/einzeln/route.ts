import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { fileCustomers, publicCustomer, saveCustomers } from '@/lib/store';
import { saveOne } from '@/lib/customer-admin';

const deny = () => NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

/** Einen Kunden speichern (neu oder geändert) */
export async function POST(req: Request) {
  if (!(await isAdmin())) return deny();
  const b = await req.json().catch(() => ({}));
  const r = saveOne(b?.customer, b?.orig);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, customer: { ...publicCustomer(r.customer), _orig: r.customer.code } });
}

/** Schnell aktiv/gesperrt schalten */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return deny();
  const b = await req.json().catch(() => ({}));
  const list = fileCustomers();
  const i = list.findIndex((c) => c.code === String(b?.code ?? ''));
  if (i < 0) return NextResponse.json({ error: 'Kunde nicht gefunden.' }, { status: 404 });
  list[i] = { ...list[i], active: !!b.active, pending: b.active ? false : list[i].pending };
  saveCustomers(list);
  return NextResponse.json({ ok: true });
}

/** Kunde löschen */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return deny();
  const b = await req.json().catch(() => ({}));
  const list = fileCustomers();
  if (!list.some((c) => c.code === String(b?.code ?? ''))) return NextResponse.json({ error: 'Kunde nicht gefunden.' }, { status: 404 });
  saveCustomers(list.filter((c) => c.code !== String(b.code)));
  return NextResponse.json({ ok: true });
}
