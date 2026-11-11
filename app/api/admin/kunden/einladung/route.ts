import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { fileCustomers } from '@/lib/store';
import { mailEnabled } from '@/lib/mail';
import { sendPasswordMail } from '@/lib/password-mail';

/** Einladung bzw. Passwort-Link an den Kunden senden */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!mailEnabled()) return NextResponse.json({ error: 'E-Mail-Versand ist nicht eingerichtet (SMTP in der .env).' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const c = fileCustomers().find((x) => x.code === String(body?.code ?? '').toUpperCase());
  if (!c?.email) return NextResponse.json({ error: 'Für diesen Kunden ist keine E-Mail hinterlegt (vorher speichern).' }, { status: 400 });
  try { await sendPasswordMail(c, !c.pw); } catch (e) { console.error(e); return NextResponse.json({ error: 'Mail konnte nicht gesendet werden.' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
