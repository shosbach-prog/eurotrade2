import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, ACCESS_DAYS, previewMode, signCode } from '@/lib/access';
import { fileCustomers, findCustomerByEmail, updateCustomer } from '@/lib/store';
import { checkResetToken, hashPassword, pwProblem } from '@/lib/password';
import { sendPasswordMail } from '@/lib/password-mail';
import { mailEnabled } from '@/lib/mail';

const tries = new Map<string, number[]>();

/** action=forgot: Link per Mail · action=set: Passwort mit Link festlegen */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  const recent = (tries.get(ip) ?? []).filter((t) => now - t < 900_000);
  if (recent.length >= 8) return NextResponse.json({ error: 'Zu viele Versuche – bitte in 15 Minuten erneut.' }, { status: 429 });
  tries.set(ip, [...recent, now]);

  const body = await req.json().catch(() => ({}));
  if (body?.action === 'forgot') {
    if (!mailEnabled()) return NextResponse.json({ error: 'E-Mail-Versand ist gerade nicht verfügbar. Bitte melden Sie sich bei info@euro-trade.com.' }, { status: 503 });
    const c = findCustomerByEmail(body?.email);
    if (c) await sendPasswordMail(c).catch((e) => console.error('Passwort-Mail fehlgeschlagen', e));
    // Immer gleiche Antwort – verrät nicht, ob die Adresse existiert
    return NextResponse.json({ ok: true });
  }
  if (body?.action === 'set') {
    const code = await checkResetToken(String(body?.token ?? ''), (code) => fileCustomers().find((c) => c.code === code && c.active !== false) ?? null);
    if (!code) return NextResponse.json({ error: 'Der Link ist abgelaufen oder wurde schon verwendet. Fordern Sie einfach einen neuen an.' }, { status: 400 });
    const pw = String(body?.password ?? '');
    const bad = pwProblem(pw);
    if (bad) return NextResponse.json({ error: bad }, { status: 400 });
    updateCustomer(code, { pw: hashPassword(pw) });
    const res = NextResponse.json({ ok: true, loggedIn: !previewMode() });
    if (!previewMode()) res.cookies.set(ACCESS_COOKIE, await signCode(code), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: ACCESS_DAYS * 86400 });
    return res;
  }
  return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
}
