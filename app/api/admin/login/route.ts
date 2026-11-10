import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminToken } from '@/lib/access';

const tries = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  const recent = (tries.get(ip) ?? []).filter((t) => now - t < 900_000);
  if (recent.length >= 8) return NextResponse.json({ error: 'Zu viele Versuche – bitte in 15 Minuten erneut.' }, { status: 429 });
  tries.set(ip, [...recent, now]);
  if (!process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'ADMIN_PASSWORD ist in der .env nicht gesetzt.' }, { status: 500 });
  const { password } = await req.json().catch(() => ({}));
  if (password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'Passwort falsch.' }, { status: 403 });
  tries.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await adminToken(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 30 * 86400 });
  return res;
}
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
