import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { anyCustomerByEmail, fileCustomers, normEmail, saveCustomers, type Customer } from '@/lib/store';
import { hashPassword, pwProblem } from '@/lib/password';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, contactBlock, h1, infoBox, layout, p, signature } from '@/lib/mail-templates';

const hits = new Map<string, number[]>();
const gen = () => Array.from(crypto.randomBytes(8), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

/** Selbst-Registrierung: Konto wird angelegt, ist aber erst nach Freigabe im Admin nutzbar */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= 5) return NextResponse.json({ error: 'Zu viele Registrierungen – bitte später erneut.' }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true }); // Honeypot
  const f = (k: string, n = 120) => String(b[k] ?? '').trim().slice(0, n);
  const first = f('first'), last = f('last'), company = f('company'), phone = f('phone', 40), type = f('type', 60), email = normEmail(b.email);
  if (!first || !last) return NextResponse.json({ error: 'Bitte Vor- und Nachnamen angeben.' }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 });
  const bad = pwProblem(String(b.password ?? ''));
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  if (!b.privacy) return NextResponse.json({ error: 'Bitte der Datenschutzerklärung zustimmen.' }, { status: 400 });
  if (anyCustomerByEmail(email)) return NextResponse.json({ error: 'Mit dieser E-Mail-Adresse gibt es bereits ein Konto. Bitte melden Sie sich an oder nutzen Sie „Passwort vergessen“.' }, { status: 409 });

  const list = fileCustomers();
  let code = gen();
  while (list.some((c) => c.code === code)) code = gen();
  const name = `${first} ${last}`;
  const c: Customer = {
    code, name: company || name, email, pw: hashPassword(String(b.password)), active: false, pending: true, createdAt: new Date().toISOString(),
    markup: null, skus: [], exclusive: false,
    note: `Selbst registriert ${new Date().toLocaleDateString('de-DE')} · ${name}${company ? ' · ' + company : ''} · ${email}${phone ? ' · ' + phone : ''}${type ? ' · ' + type : ''}`,
  };
  saveCustomers([c, ...list]);

  try {
    await sendMail({ to: process.env.INQUIRY_TO ?? '', replyTo: email, subject: `Neue Registrierung: ${company || name}`,
      html: layout({ preheader: `${company || name} hat sich registriert und wartet auf Freigabe`, title: 'Neue Registrierung',
        body: h1('Neue Registrierung') + infoBox([['Wer', esc(company || name)], ['Art', esc(type || '–')]], '#ffc21a')
          + contactBlock({ name, company, email, phone })
          + p('Das Konto ist angelegt, aber noch gesperrt. Zum Freischalten im Admin „Konto aktiv“ anhaken und speichern – der Kunde bekommt dann automatisch eine E-Mail.')
          + button(`${shopUrl()}/admin/kunden`, 'Jetzt freischalten →') }) });
    await sendMail({ to: email, subject: `Ihre Registrierung bei ${process.env.SHOP_NAME ?? 'Euro-Trade'}`,
      html: layout({ preheader: 'Wir prüfen Ihr Konto und schalten es in der Regel innerhalb von 24 Stunden frei.', title: 'Ihre Registrierung',
        body: h1('Vielen Dank für Ihre Registrierung!') + p(`Guten Tag ${esc(name)},`)
          + p('Ihr Konto ist angelegt. Wir prüfen Ihre Angaben und schalten es in der Regel <strong>innerhalb von 24 Stunden</strong> frei. Sie erhalten dann eine E-Mail und können sich mit Ihrer E-Mail-Adresse und Ihrem Passwort anmelden.')
          + p('Fragen? Antworten Sie einfach auf diese E-Mail.') + signature() }) });
  } catch (e) { console.error('Mail Registrierung fehlgeschlagen', e); }
  return NextResponse.json({ ok: true });
}
