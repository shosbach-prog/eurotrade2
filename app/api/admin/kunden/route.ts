import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { saveCustomers, type Customer } from '@/lib/store';

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const list: Customer[] = (Array.isArray(body?.customers) ? body.customers : []).slice(0, 2000).map((c: any) => ({
    code: String(c.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40),
    name: String(c.name ?? '').trim().slice(0, 120),
    markup: c.markup === '' || c.markup == null || !Number.isFinite(Number(c.markup)) ? null : Math.max(0, Math.min(500, Number(c.markup))),
    skus: (Array.isArray(c.skus) ? c.skus : []).map((s: unknown) => String(s).trim().toUpperCase()).filter(Boolean).slice(0, 500),
    exclusive: !!c.exclusive,
    logoId: /^[a-f0-9]{24}$/.test(String(c.logoId ?? '')) ? String(c.logoId) : null,
    logoName: c.logoId ? String(c.logoName ?? '').slice(0, 120) : null,
    note: String(c.note ?? '').slice(0, 1000),
    active: c.active !== false,
  }));
  const bad = list.find((c) => c.code.length < 4);
  if (bad) return NextResponse.json({ error: 'Jeder Code braucht mindestens 4 Zeichen (A–Z, 0–9, -).' }, { status: 400 });
  const dup = list.find((c, n) => list.findIndex((x) => x.code === c.code) !== n);
  if (dup) return NextResponse.json({ error: `Der Code ${dup.code} ist doppelt vergeben.` }, { status: 400 });
  saveCustomers(list.map((c) => ({ ...c, name: c.name || c.code })));
  return NextResponse.json({ ok: true });
}
