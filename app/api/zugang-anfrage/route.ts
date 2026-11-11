import { NextResponse } from 'next/server';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, contactBlock, h1, infoBox, layout, p, quote, signature } from '@/lib/mail-templates';
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
      html: layout({ preheader: `${r.company || r.name} möchte Zugang zum Shop`, title: 'Neue Zugangsanfrage',
        body: h1('Neue Zugangsanfrage') + infoBox([['Wer', esc(r.company || r.name)], ['Art', esc(r.type || '–')]], '#ffc21a')
          + contactBlock({ name: r.name, company: r.company, email: r.email, phone: r.phone })
          + (r.message ? `<div style="font-size:13px;font-weight:700;margin:0 0 6px">Vorhaben</div>${quote(r.message)}` : '')
          + button(`${shopUrl()}/admin/kunden`, 'Als Kunde anlegen →') }) });
    await sendMail({ to: r.email, subject: `Ihre Zugangsanfrage bei ${process.env.SHOP_NAME ?? 'Euro-Trade'}`,
      html: layout({ preheader: 'Ihr persönlicher Zugangscode folgt innerhalb von 24 Stunden.', title: 'Ihre Zugangsanfrage',
        body: h1('Vielen Dank für Ihr Interesse!') + p(`Guten Tag ${esc(r.name)},`)
          + p(`wir haben Ihre Anfrage erhalten. Innerhalb von <strong>24 Stunden</strong> melden wir uns mit Ihrem persönlichen Zugangscode – damit sehen Sie Ihre Konditionen, können Logos hochladen und erhalten Angebote mit einem Klick.`)
          + p('Bis dahin finden Sie auf unserer Website alles rund um Druck und Stick:', true)
          + button(`${shopUrl()}/druck-stick`, 'Druck & Stick im Vergleich')
          + p('Fragen? Antworten Sie einfach auf diese E-Mail.') + signature() }) });
  } catch (e) { console.error('Mail Zugangsanfrage fehlgeschlagen', e); }
  return NextResponse.json({ ok: true });
}
