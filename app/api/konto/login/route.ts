import { NextResponse } from 'next/server';
import { getCustomer } from '@/lib/customer';
import { fileCustomers, normEmail, updateCustomer } from '@/lib/store';
import { hashPassword, pwProblem, verifyPassword } from '@/lib/password';

/** Angemeldeter Kunde: Login-Daten ansehen */
export async function GET() {
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  return NextResponse.json({ email: c.email ?? '', hasPw: !!c.pw, editable: fileCustomers().some((x) => x.code === c.code) });
}

/** Angemeldeter Kunde: E-Mail + Passwort festlegen/ändern */
export async function POST(req: Request) {
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!fileCustomers().some((x) => x.code === c.code)) return NextResponse.json({ error: 'Für diesen Zugang kann kein Passwort hinterlegt werden. Bitte melden Sie sich bei info@euro-trade.com.' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const email = normEmail(body?.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 });
  if (fileCustomers().some((x) => x.code !== c.code && normEmail(x.email) === email)) return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits einem anderen Zugang zugeordnet.' }, { status: 400 });
  if (c.pw && !verifyPassword(String(body?.current ?? ''), c.pw)) return NextResponse.json({ error: 'Das aktuelle Passwort stimmt nicht.' }, { status: 403 });
  const pw = String(body?.password ?? '');
  const bad = pwProblem(pw);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  updateCustomer(c.code, { email, pw: hashPassword(pw) });
  return NextResponse.json({ ok: true });
}
