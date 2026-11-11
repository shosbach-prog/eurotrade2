import 'server-only';
import crypto from 'node:crypto';
import { esc, sendMail, shopUrl } from './mail';
import { button, h1, infoBox, layout, p, signature } from './mail-templates';
import { discountTiers, listSubscribers, saveSubscribers, type Subscriber } from './store';

const eurShort = (n: number) => `${n.toLocaleString('de-DE')} €`;
export const tierText = () => discountTiers().map((t) => `${t.pct} % ab ${eurShort(t.min)}`).join(' · ');
const newCode = () => 'ET-' + Array.from(crypto.randomBytes(6), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

export async function sendConfirm(s: Subscriber) {
  const link = `${shopUrl()}/newsletter/bestaetigen/${s.token}`;
  await sendMail({
    to: s.email, subject: 'Bitte bestätigen: Ihr Willkommensrabatt bei euro-trade.com',
    html: layout({
      preheader: 'Nur noch ein Klick – dann erhalten Sie Ihren persönlichen Rabattcode.', title: 'Anmeldung bestätigen',
      body: h1('Fast geschafft!')
        + p('Bitte bestätigen Sie Ihre Anmeldung zu unserem Newsletter. Direkt danach erhalten Sie Ihren persönlichen Rabattcode für Ihre erste Bestellung:')
        + infoBox(discountTiers().map((t) => [`${t.pct} % Rabatt`, `ab ${eurShort(t.min)} Warenwert`]), '#ffc21a')
        + button(link, 'Anmeldung bestätigen', '#1d7a3e')
        + p('Sie haben sich nicht angemeldet? Dann ignorieren Sie diese E-Mail einfach – ohne Bestätigung senden wir Ihnen nichts.', true)
        + signature(),
    }),
  });
}

/** Bestätigung: Code vergeben und Willkommens-Mail senden (nur beim ersten Mal) */
export async function confirm(token: string): Promise<Subscriber | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const list = listSubscribers();
  const s = list.find((x) => x.token === token);
  if (!s) return null;
  if (s.confirmed && !s.unsubscribedAt) return s;
  s.confirmed = true; s.confirmedAt = new Date().toISOString(); s.unsubscribedAt = null;
  s.code ??= newCode();
  saveSubscribers(list);
  try {
    await sendMail({
      to: s.email, subject: `Ihr Willkommensrabatt: ${s.code}`,
      html: layout({
        preheader: `Ihr persönlicher Code ${s.code} – bis zu ${Math.max(...discountTiers().map((t) => t.pct))} % auf Ihre erste Bestellung.`, title: 'Ihr Rabattcode',
        body: h1('Willkommen bei euro-trade.com!')
          + p('Vielen Dank für Ihre Anmeldung. Hier ist Ihr persönlicher Rabattcode für Ihre erste Bestellung:')
          + `<div style="margin:6px 0 18px;padding:18px;border:2px dashed #ffc21a;border-radius:12px;text-align:center;background:#fffbea"><div style="font-size:12px;color:#5d6675;text-transform:uppercase;letter-spacing:1.4px">Ihr Code</div><div style="font-size:30px;font-weight:900;letter-spacing:3px;color:#14181f;font-family:Menlo,Consolas,monospace">${esc(s.code)}</div></div>`
          + infoBox(discountTiers().map((t) => [`${t.pct} % Rabatt`, `ab ${eurShort(t.min)} Warenwert`]), '#ffc21a')
          + p('So geht’s: Artikel in den Warenkorb legen, den Code im Feld „Rabattcode“ eingeben und Angebot anfordern – der Rabatt wird im Angebot automatisch abgezogen.')
          + button(`${shopUrl()}/`, 'Jetzt stöbern')
          + p('Gültig für Neukunden, einmalig einlösbar, auf den Netto-Warenwert der Textilien (ohne Veredelung und Versand).', true)
          + signature(),
        footerNote: `Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben. <a href="${shopUrl()}/newsletter/abmelden/${s.token}" style="color:#5d6675">Abmelden</a>`,
      }),
    });
  } catch (e) { console.error('Willkommens-Mail fehlgeschlagen', e); }
  return s;
}

export function unsubscribe(token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const list = listSubscribers();
  const s = list.find((x) => x.token === token);
  if (!s) return null;
  s.unsubscribedAt ??= new Date().toISOString();
  saveSubscribers(list);
  return s;
}
