import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, ACCESS_DAYS, previewMode, signCode } from '@/lib/access';
import { anyCustomerByEmail } from '@/lib/store';
import { verifyPassword } from '@/lib/password';

const tries = new Map<string, number[]>();

/** Anmeldung mit E-Mail + Passwort – setzt dasselbe Zugangs-Cookie wie der Code */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  const recent = (tries.get(ip) ?? []).filter((t) => now - t < 900_000);
  if (recent.length >= 10) return NextResponse.json({ error: 'Zu viele Versuche – bitte in 15 Minuten erneut.' }, { status: 429 });
  tries.set(ip, [...recent, now]);

  if (previewMode()) return NextResponse.json({ error: 'Unser Shop startet in Kürze – Ihr Zugang wird dann freigeschaltet. Bei Fragen: info@euro-trade.com' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const c = anyCustomerByEmail(body?.email);
  if (!c || !verifyPassword(String(body?.password ?? ''), c.pw)) return NextResponse.json({ error: 'E-Mail oder Passwort ist falsch.' }, { status: 403 });
  if (c.active === false) return NextResponse.json({ error: c.pending ? 'Ihr Konto wird gerade geprüft. Sie erhalten eine E-Mail, sobald es freigeschaltet ist – in der Regel innerhalb von 24 Stunden.' : 'Dieses Konto ist gesperrt. Bei Fragen: info@euro-trade.com' }, { status: 403 });

  tries.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, await signCode(c.code), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: ACCESS_DAYS * 86400 });
  return res;
}
