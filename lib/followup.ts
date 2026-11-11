import 'server-only';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { esc, mailEnabled, sendMail, shopUrl } from './mail';
import { button, h1, layout, p, signature } from './mail-templates';
import { DATA, addHistory, listInquiries, listReviews, offerTotals, readJSON, saveInquiry, writeJSON } from './store';
import { reviewDays, sendReviewRequest } from './review-mail';
import { getPricing } from './deco-pricing-store';

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
            + p('Lieber kurz telefonieren? Wir sind unter 030 40719258 für Sie da.', true)
            + signature(),
        }),
      });
      i.remindedAt = new Date().toISOString();
      addHistory(i, `Erinnerung zum Angebot gesendet (nach ${days} Tagen)`);
      saveInquiry(i);
      sent++;
    } catch (e) { console.error('Nachfass-Mail fehlgeschlagen', i.no, e); failed++; }
  }
  // Ablauf-Erinnerung X Tage vor Ende der Gültigkeit – optional mit Rabatt bei Annahme bis zum Ablauf
  const rm = getPricing().remind ?? { expiryDays: 3, expiryPct: 0, cart: true };
  let exp = 0;
  if (mailEnabled() && rm.expiryDays > 0) for (const i of listInquiries()) {
    const o = i.offer;
    if (i.status !== 'angebot' || !o?.sentAt || i.expiryRemindedAt || !i.token || !i.customer?.email) continue;
    const end = Date.parse(o.createdAt) + (o.validDays ?? 14) * 864e5, left = end - now;
    if (left <= 12 * 36e5 || left > rm.expiryDays * 864e5) continue;
    if (i.remindedAt && now - Date.parse(i.remindedAt) < 2 * 864e5) continue; // nicht direkt nach der Nachfass-Mail
    const until = new Date(end).toLocaleDateString('de-DE');
    let bonus = '';
    if (rm.expiryPct > 0 && !o.lines.some((l) => l.text.startsWith('Rabatt bei Annahme'))) {
      const goods = o.lines.filter((l) => l.price > 0).reduce((x, l) => x + l.qty * l.price, 0);
      const off = Math.round(goods * rm.expiryPct) / 100;
      if (off > 0) { o.lines.push({ text: `Rabatt bei Annahme bis ${until}`, detail: `${rm.expiryPct} % auf den Warenwert`, qty: 1, price: -off }); bonus = `Als kleines Dankeschön haben wir Ihnen <strong>${rm.expiryPct} % Rabatt</strong> (${off.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}) direkt ins Angebot eingerechnet – gültig bei Annahme bis ${until}.`; }
    }
    try {
      await sendMail({
        to: i.customer.email, replyTo: process.env.INQUIRY_TO, subject: `Ihr Angebot ${i.no} läuft am ${until} ab`,
        html: layout({
          preheader: `Nur noch bis ${until} gültig – mit einem Klick annehmen.`, title: 'Ihr Angebot',
          body: h1('Ihr Angebot läuft bald ab')
            + p(`Guten Tag ${esc(i.customer.name)},`)
            + p(`unser Angebot <strong>${i.no}</strong> über <strong>${offerTotals(o).gross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</strong> ist noch bis <strong>${until}</strong> gültig. Danach können sich Preise und Liefertermine ändern.`)
            + (bonus ? p(bonus) : '')
            + button(`${shopUrl()}/angebot/${i.token}`, 'Angebot ansehen & annehmen')
            + p('Sie brauchen mehr Zeit oder möchten etwas ändern? Antworten Sie einfach auf diese E-Mail – wir verlängern gern.', true)
            + signature(),
        }),
      });
      i.expiryRemindedAt = new Date().toISOString();
      addHistory(i, `Ablauf-Erinnerung gesendet${bonus ? ` (mit ${rm.expiryPct} % Rabatt im Angebot)` : ''}`);
      saveInquiry(i);
      exp++;
    } catch (e) { console.error('Ablauf-Erinnerung fehlgeschlagen', i.no, e); failed++; }
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
  const result = !mailEnabled() ? `${due.length} fällig – kein Mailversand eingerichtet` : `${sent} Angebots-Erinnerung(en), ${exp} Ablauf-Erinnerung(en), ${rev} Bewertungseinladung(en), ${revRem} Bewertungs-Erinnerung(en)${failed ? `, ${failed} fehlgeschlagen` : ''}`;
  writeJSON(STATE, { lastRun: new Date().toISOString(), lastResult: result });
  return { due: due.length, sent, failed, result };
}
