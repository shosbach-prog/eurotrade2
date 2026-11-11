import 'server-only';
import { esc, sendMail, shopUrl } from './mail';
import { button, h1, layout, p, signature } from './mail-templates';
import type { Inquiry } from './store';

/** Einladung zur Bewertung (nach Lieferung) */
export async function sendReviewRequest(i: Inquiry, reminder = false) {
  const link = `${shopUrl()}/bewerten/${i.token}`;
  const products = [...new Map(i.lines.map((l) => [l.id ?? l.sku, l.name])).values()];
  return sendMail({
    to: i.customer.email, replyTo: process.env.INQUIRY_TO, subject: reminder ? `Kurze Erinnerung: Ihre Meinung zu Bestellung ${i.no}` : `Wie zufrieden sind Sie mit Ihrer Bestellung ${i.no}?`,
    html: layout({
      preheader: 'Ihre Meinung hilft anderen Vereinen und Unternehmen – dauert nur 1 Minute.', title: 'Ihre Bewertung',
      body: h1('Wie gefällt Ihnen Ihre Bestellung?')
        + p(`Guten Tag ${esc(i.customer.name)},`)
        + p(`Ihre Bestellung <strong>${i.no}</strong> sollte inzwischen bei Ihnen angekommen sein. Wir würden uns sehr freuen, wenn Sie uns kurz sagen, wie zufrieden Sie sind – mit den Artikeln und mit uns.`)
        + p(`Bewerten können Sie: ${products.map(esc).join(', ')}.`, true)
        + `<div style="margin:6px 0 4px;font-size:30px;letter-spacing:4px;color:#ffb300">★★★★★</div>`
        + button(link, 'Jetzt bewerten', '#1d7a3e')
        + p('Etwas war nicht in Ordnung? Antworten Sie einfach auf diese E-Mail – wir kümmern uns sofort darum.', true)
        + signature(),
    }),
  });
}

export const reviewDays = () => Math.max(1, Number(process.env.BEWERTUNG_TAGE ?? 7));
