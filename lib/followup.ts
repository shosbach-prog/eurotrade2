import 'server-only';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { esc, mailEnabled, sendMail, shopUrl } from './mail';
import { button, h1, layout, p, signature } from './mail-templates';
import { DATA, addHistory, listInquiries, listReviews, offerTotals, readJSON, saveInquiry, writeJSON } from './store';
import { reviewDays, sendReviewRequest } from './review-mail';

const STATE = path.join(DATA, 'cron.json');
export const followDays = () => Math.max(1, Number(process.env.NACHFASS_TAGE ?? 3));
/** Geheimer Schlüssel für den täglichen Aufruf – liegt in data/cron-key (wird beim ersten Mal erzeugt) */
export function cronKey() {
  const f = path.join(DATA, 'cron-key');
  try { const k = fs.readFileSync(f, 'utf8').trim(); if (k.length >= 32) return k; } catch {}
  const k = crypto.randomBytes(24).toString('hex');
  fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(f, k);
  return k;
}
export const cronState = () => readJSON<{ lastRun?: string; lastResult?: string }>(STATE, {});

/** Angebote, die seit X Tagen unbeantwortet sind, einmal freundlich nachfassen */
export async function runFollowUps() {
  const now = Date.now(), days = followDays();
  const due = listInquiries().filter((i) => {
    if (i.status !== 'angebot' || !i.offer?.sentAt || i.remindedAt || !i.token || !i.customer?.email) return false;
    const sent = Date.parse(i.offer.sentAt);
    const validUntil = Date.parse(i.offer.createdAt) + (i.offer.validDays ?? 14) * 864e5;
    return now - sent >= days * 864e5 && now < validUntil;
  });
  let sent = 0, failed = 0;
  if (mailEnabled()) for (const i of due) {
    const o = i.offer!;
    const until = new Date(Date.parse(o.createdAt) + (o.validDays ?? 14) * 864e5).toLocaleDateString('de-DE');
    try {
      await sendMail({
        to: i.customer.email, replyTo: process.env.INQUIRY_TO, subject: `Noch Fragen zu Ihrem Angebot ${i.no}?`,
        html: layout({
          preheader: `Ihr Angebot ist noch bis ${until} gültig – mit einem Klick annehmen.`, title: 'Ihr Angebot',
          body: h1('Noch Fragen zu Ihrem Angebot?')
            + p(`Guten Tag ${esc(i.customer.name)},`)
            + p(`vor ein paar Tagen haben wir Ihnen unser Angebot <strong>${i.no}</strong> über <strong>${offerTotals(o).gross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</strong> geschickt. Es ist noch bis <strong>${until}</strong> gültig.`)
            + p('Passt alles? Dann nehmen Sie es einfach mit einem Klick an. Sie möchten etwas ändern – Farbe, Menge, Veredelung oder Termin? Antworten Sie auf diese E-Mail, wir passen das Angebot gerne an.')
            + button(`${shopUrl()}/angebot/${i.token}`, 'Angebot ansehen & annehmen')
            + p('Lieber kurz telefonieren? Wir sind unter 0173 2648097 für Sie da.', true)
            + signature(),
        }),
      });
      i.remindedAt = new Date().toISOString();
      addHistory(i, `Erinnerung zum Angebot gesendet (nach ${days} Tagen)`);
      saveInquiry(i);
      sent++;
    } catch (e) { console.error('Nachfass-Mail fehlgeschlagen', i.no, e); failed++; }
  }
  // Bewertungseinladung X Tage nach Lieferung, eine Erinnerung 7 Tage später (nur ohne Bewertung)
  const rd = reviewDays(), reviewed = new Set(listReviews().map((r) => r.inquiryNo));
  let rev = 0, revRem = 0;
  if (mailEnabled()) for (const i of listInquiries()) {
    if (i.status !== 'geliefert' || !i.deliveredAt || !i.token || !i.customer?.email || reviewed.has(i.no)) continue;
    const first = !i.reviewRequestedAt && now - Date.parse(i.deliveredAt) >= rd * 864e5;
    const again = !!i.reviewRequestedAt && !i.reviewRemindedAt && now - Date.parse(i.reviewRequestedAt) >= 7 * 864e5 && now - Date.parse(i.deliveredAt) < 60 * 864e5;
    if (!first && !again) continue;
    try {
      await sendReviewRequest(i, again);
      if (first) { i.reviewRequestedAt = new Date().toISOString(); addHistory(i, `Bewertungseinladung gesendet (${rd} Tage nach Lieferung)`); rev++; }
      else { i.reviewRemindedAt = new Date().toISOString(); addHistory(i, 'Erinnerung zur Bewertung gesendet'); revRem++; }
      saveInquiry(i);
    } catch (e) { console.error('Bewertungsmail fehlgeschlagen', i.no, e); failed++; }
  }
  const result = !mailEnabled() ? `${due.length} fällig – kein Mailversand eingerichtet` : `${sent} Angebots-Erinnerung(en), ${rev} Bewertungseinladung(en), ${revRem} Bewertungs-Erinnerung(en)${failed ? `, ${failed} fehlgeschlagen` : ''}`;
  writeJSON(STATE, { lastRun: new Date().toISOString(), lastResult: result });
  return { due: due.length, sent, failed, result };
}
