import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { isAdmin } from '@/lib/customer';

/** Testmail senden – zeigt den genauen Fehler des Mailservers */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const to = String(b?.to || process.env.INQUIRY_TO || '').trim();
  if (!process.env.SMTP_HOST) return NextResponse.json({ ok: false, step: 'config', error: 'SMTP_HOST ist in der .env nicht gesetzt.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return NextResponse.json({ ok: false, step: 'config', error: 'Keine gültige Empfänger-Adresse (INQUIRY_TO).' });
  const port = Number(process.env.SMTP_PORT ?? 587);
  const tx = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 15_000, greetingTimeout: 10_000, socketTimeout: 20_000,
  });
  try { await tx.verify(); } catch (e: any) { return NextResponse.json({ ok: false, step: 'login', error: String(e?.message ?? e), code: e?.code ?? null, response: e?.response ?? null }); }
  try {
    await tx.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject: 'Testmail von euro-trade.com', text: `Der Mailversand funktioniert.\n\nGesendet: ${new Date().toLocaleString('de-DE')}` });
  } catch (e: any) { return NextResponse.json({ ok: false, step: 'send', error: String(e?.message ?? e), code: e?.code ?? null, response: e?.response ?? null }); }
  return NextResponse.json({ ok: true, to });
}
