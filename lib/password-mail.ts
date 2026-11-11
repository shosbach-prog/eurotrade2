import 'server-only';
import { esc, sendMail, shopUrl } from './mail';
import { button, h1, layout, p } from './mail-templates';
import { resetToken } from './password';
import type { Customer } from './store';

/** E-Mail mit Link zum Passwort festlegen (Einladung) bzw. zurücksetzen */
export async function sendPasswordMail(c: Customer, invite = false) {
  if (!c.email) return false;
  const link = `${shopUrl()}/passwort?t=${await resetToken(c.code, c.pw)}`;
  const title = invite ? 'Ihr Zugang zum Euro-Trade Shop' : 'Passwort zurücksetzen';
  const body = [
    h1(invite ? 'Willkommen bei Euro-Trade' : 'Neues Passwort festlegen'),
    p(`Guten Tag${c.name ? ' ' + esc(c.name) : ''},`),
    p(invite
      ? 'Ihr persönlicher Zugang zu unserem Textil-Shop ist freigeschaltet. Legen Sie jetzt Ihr Passwort fest – danach melden Sie sich einfach mit Ihrer E-Mail-Adresse an.'
      : 'Sie haben ein neues Passwort angefordert. Klicken Sie auf den Button, um es festzulegen.'),
    button(link, invite ? 'Passwort festlegen' : 'Neues Passwort festlegen'),
    p(`Der Link ist 48 Stunden gültig und kann einmal verwendet werden.${invite ? '' : ' Wenn Sie kein neues Passwort angefordert haben, ignorieren Sie diese E-Mail einfach.'}`, true),
  ].join('');
  await sendMail({ to: c.email, subject: title, html: layout({ preheader: invite ? 'Passwort festlegen und loslegen' : 'Link zum Zurücksetzen Ihres Passworts', title, body }) });
  return true;
}
