import { NextResponse } from 'next/server';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { listAccessRequests, randomId, saveAccessRequests } from '@/lib/store';

const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= 3) return NextResponse.json({ error: 'Zu viele Anfragen – bitte später erneut.' }, { status: 429 });
  hits.set(ip, [...recent, now]);
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true }); // Honeypot
  const f = (k: string, n = 200) => String(b[k] ?? '').trim().slice(0, n);
  const r = { id: randomId(6), date: new Date().toISOString(), name: f('name'), company: f('company'), email: f('email'), phone: f('phone', 60), type: f('type', 60), message: f('message', 2000) };
  if (!r.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) return NextResponse.json({ error: 'Bitte Name und gültige E-Mail angeben.' }, { status: 400 });
  if (!b.privacy) return NextResponse.json({ error: 'Bitte der Datenschutzerklärung zustimmen.' }, { status: 400 });
  saveAccessRequests([...listAccessRequests(), r]);
  try {
    await sendMail({ to: process.env.INQUIRY_TO ?? '', replyTo: r.email, subject: `Zugangsanfrage: ${r.company || r.name}`,
      html: `<h2>Neue Zugangsanfrage</h2><p><b>${esc(r.name)}</b>${r.company ? ` – ${esc(r.company)}` : ''}<br>${esc(r.email)} · ${esc(r.phone)}<br>Art: ${esc(r.type)}</p><p>${esc(r.message).replace(/\n/g, '<br>')}</p><p><a href="${shopUrl()}/admin/kunden">→ Im Admin als Kunde anlegen</a></p>` });
    await sendMail({ to: r.email, subject: `Ihre Zugangsanfrage bei ${process.env.SHOP_NAME ?? 'Euro-Trade'}`,
      html: `<p>Guten Tag ${esc(r.name)},</p><p>vielen Dank für Ihr Interesse! Wir melden uns innerhalb von 24 Stunden mit Ihrem persönlichen Zugangscode.</p><p>Mit freundlichen Grüßen<br>${esc(process.env.SHOP_NAME ?? 'Euro-Trade')}</p>` });
  } catch (e) { console.error('Mail Zugangsanfrage fehlgeschlagen', e); }
  return NextResponse.json({ ok: true });
}
