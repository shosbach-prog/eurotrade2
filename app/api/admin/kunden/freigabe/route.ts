import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { fileCustomers, saveCustomers } from '@/lib/store';
import { esc, mailEnabled, sendMail, shopUrl } from '@/lib/mail';
import { button, h1, layout, p, signature } from '@/lib/mail-templates';

/** Registrierung freischalten (approve) oder ablehnen (reject = löschen) */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const list = fileCustomers();
  const i = list.findIndex((c) => c.code === String(b?.code ?? ''));
  if (i < 0) return NextResponse.json({ error: 'Kunde nicht gefunden.' }, { status: 404 });
  const c = list[i];
  if (b?.action === 'reject') { saveCustomers(list.filter((_, n) => n !== i)); return NextResponse.json({ ok: true }); }
  list[i] = { ...c, active: true, pending: false };
  saveCustomers(list);
  let mailed = false;
  if (mailEnabled() && c.email) {
    try {
      await sendMail({ to: c.email, subject: `Ihr Konto bei ${process.env.SHOP_NAME ?? 'Euro-Trade'} ist freigeschaltet`,
        html: layout({ preheader: 'Sie können sich jetzt anmelden und bestellen.', title: 'Konto freigeschaltet',
          body: h1('Ihr Konto ist freigeschaltet') + p(`Guten Tag ${esc(c.name)},`)
            + p('Ihr Kundenkonto ist jetzt aktiv. Melden Sie sich mit Ihrer E-Mail-Adresse und Ihrem Passwort an – dann sehen Sie Ihre Preise, können Logos hochladen und direkt anfragen.')
            + button(`${shopUrl()}/zugang`, 'Jetzt anmelden') + signature() }) });
      mailed = true;
    } catch (e) { console.error('Freischalt-Mail fehlgeschlagen', e); }
  }
  return NextResponse.json({ ok: true, mailed });
}
