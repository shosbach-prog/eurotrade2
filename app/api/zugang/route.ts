import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, ACCESS_DAYS, normCode, previewMode, signCode } from '@/lib/access';
import { findCustomer } from '@/lib/store';

const tries = new Map<string, number[]>();

export async function POST(req: Request) {
  // Schutz gegen Durchprobieren: max. 10 Versuche / 15 Min. pro IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  const recent = (tries.get(ip) ?? []).filter((t) => now - t < 900_000);
  if (recent.length >= 10) return NextResponse.json({ error: 'Zu viele Versuche – bitte in 15 Minuten erneut.' }, { status: 429 });
  tries.set(ip, [...recent, now]);

  if (previewMode()) return NextResponse.json({ error: 'Unser Shop startet in Kürze – Ihr Zugang wird dann freigeschaltet. Bei Fragen: info@euro-trade.com' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const c = findCustomer(normCode(body?.code));
  if (!c) return NextResponse.json({ error: 'Dieser Code ist ungültig.' }, { status: 403 });

  tries.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, await signCode(c.code), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: ACCESS_DAYS * 86400,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
