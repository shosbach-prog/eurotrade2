import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, contactBlock, h1, infoBox, layout, p, quote, signature } from '@/lib/mail-templates';
import { UPLOADS, listAccessRequests, randomId, saveAccessRequests, writeJSON } from '@/lib/store';

const hits = new Map<string, number[]>();
const LOGO = ['png', 'jpg', 'jpeg', 'svg', 'pdf', 'ai', 'eps'];

/** Schnelle Preisanfrage ohne Zugangscode – mit optionalem Logo und Musterwunsch */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= 4) return NextResponse.json({ error: 'Zu viele Anfragen – bitte später erneut oder rufen Sie uns an.' }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  if (form.get('website')) return NextResponse.json({ ok: true }); // Honeypot
  const f = (k: string, n = 200) => String(form.get(k) ?? '').trim().slice(0, n);
  const r = { id: randomId(6), date: new Date().toISOString(), kind: 'preis' as const, name: f('name'), company: f('company'), email: f('email'), phone: f('phone', 60), type: f('type', 60),
    category: f('category', 80), qty: f('qty', 40), deco: f('deco', 60), sample: form.get('sample') === 'on', message: f('message', 2000), logoId: undefined as string | undefined, logoName: undefined as string | undefined };
  if (!r.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) return NextResponse.json({ error: 'Bitte Name und gültige E-Mail angeben.' }, { status: 400 });
  if (!form.get('privacy')) return NextResponse.json({ error: 'Bitte der Datenschutzerklärung zustimmen.' }, { status: 400 });

  const file = form.get('logo');
  if (file instanceof File && file.size > 0) {
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!LOGO.includes(ext)) return NextResponse.json({ error: 'Logo bitte als PNG, JPG, SVG, PDF, AI oder EPS.' }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'Logo ist größer als 15 MB.' }, { status: 400 });
    const id = randomId();
    fs.mkdirSync(UPLOADS, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS, `${id}.${ext}`), Buffer.from(await file.arrayBuffer()));
    r.logoName = file.name.replace(/[^\w.\- äöüÄÖÜß()]/g, '_').slice(0, 120);
    writeJSON(path.join(UPLOADS, `${id}.json`), { name: r.logoName, ext, size: file.size, date: r.date });
    r.logoId = id;
  }
  saveAccessRequests([...listAccessRequests(), r]);

  const rows: [string, string][] = [['Artikel', esc(r.category || 'offen')], ['Menge', esc(r.qty || '–')], ['Veredelung', esc(r.deco || '–')], ['Muster', r.sample ? 'ja, gewünscht' : 'nein'], ['Logo', r.logoId ? esc(r.logoName ?? 'ja') : 'nicht hochgeladen']];
  try {
    await sendMail({ to: process.env.INQUIRY_TO ?? '', replyTo: r.email, subject: `Preisanfrage: ${r.company || r.name}${r.qty ? ` · ${r.qty} Stk.` : ''}`,
      html: layout({ preheader: `${r.company || r.name}: ${r.category || 'Textilien'} ${r.qty ? `· ${r.qty} Stück` : ''}`, title: 'Neue Preisanfrage',
        body: h1('Neue Preisanfrage (ohne Zugang)') + infoBox(rows, '#ffc21a')
          + contactBlock({ name: r.name, company: r.company, email: r.email, phone: r.phone }, r.type ? [['Art', esc(r.type)]] : [])
          + (r.message ? `<div style="font-size:13px;font-weight:700;margin:0 0 6px">Nachricht</div>${quote(r.message)}` : '')
          + (r.logoId ? button(`${shopUrl()}/api/upload/${r.logoId}?download`, 'Logo herunterladen') : '')
          + button(`${shopUrl()}/admin/kunden`, 'Im Admin ansehen →', '#1d7a3e') }) });
    await sendMail({ to: r.email, subject: `Ihre Preisanfrage bei ${process.env.SHOP_NAME ?? 'Euro-Trade'}`,
      html: layout({ preheader: 'Wir melden uns innerhalb von 24 Stunden mit Ihrem Angebot.', title: 'Ihre Preisanfrage',
        body: h1('Vielen Dank für Ihre Anfrage!') + p(`Guten Tag ${esc(r.name)},`)
          + p('wir haben Ihre Preisanfrage erhalten und melden uns innerhalb von <strong>24 Stunden</strong> mit einem Angebot oder Rückfragen zu Ihrem Motiv.')
          + infoBox(rows)
          + p('Mit dem Angebot erhalten Sie auf Wunsch auch Ihren persönlichen Zugangscode für unseren Shop.', true)
          + p('Fragen? Antworten Sie einfach auf diese E-Mail.') + signature() }) });
  } catch (e) { console.error('Mail Preisanfrage fehlgeschlagen', e); }
  return NextResponse.json({ ok: true });
}
