import 'server-only';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { DATA, randomId, readJSON, writeJSON } from './store';
import { esc, mailEnabled, sendMail, shopUrl } from './mail';
import { button, h1, layout, p, signature } from './mail-templates';
import { saveSharedCart, type SharedLine } from './shared-cart';
import { getPricing } from './deco-pricing-store';

/** Warenkorb-Erinnerung: nur mit ausdrücklicher Einwilligung im Warenkorb, eine Mail nach ca. 24 Stunden, jederzeit abbestellbar */
const DIR = path.join(DATA, 'warenkorb-erinnerung');
type Entry = { email: string; name: string; shareId: string; count: number; token: string; createdAt: string; updatedAt: string; consentAt: string; remindedAt?: string | null; done?: string | null };
const fileOf = (email: string) => path.join(DIR, `${crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 32)}.json`);
const okMail = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(e);

export function rememberCart(email: string, name: string, lines: SharedLine[]): boolean {
  if (!okMail(email) || !lines.length) return false;
  const shareId = saveSharedCart(lines); if (!shareId) return false;
  const f = fileOf(email), old = readJSON<Entry | null>(f, null), now = new Date().toISOString();
  // nach erfolgter Erinnerung oder Abmeldung nicht erneut anlegen (keine Mail-Serie)
  if (old?.done === 'abgemeldet') return false;
  fs.mkdirSync(DIR, { recursive: true });
  writeJSON(f, { email: email.trim(), name: name.trim().slice(0, 80), shareId, count: lines.reduce((s, l) => s + l.qty, 0), token: old?.token ?? randomId(16), createdAt: old && !old.done ? old.createdAt : now, updatedAt: now, consentAt: now, remindedAt: old?.done ? null : old?.remindedAt ?? null, done: null } satisfies Entry);
  return true;
}
/** Anfrage abgeschickt → keine Erinnerung */
export function cartDone(email: string) {
  const f = fileOf(email), e = readJSON<Entry | null>(f, null);
  if (e && !e.done) writeJSON(f, { ...e, done: 'angefragt' });
}
export function unsubscribeCart(token: string): boolean {
  if (!/^[a-f0-9]{32}$/.test(token) || !fs.existsSync(DIR)) return false;
  for (const n of fs.readdirSync(DIR)) {
    const f = path.join(DIR, n), e = readJSON<Entry | null>(f, null);
    if (e?.token === token) { writeJSON(f, { ...e, done: 'abgemeldet' }); return true; }
  }
  return false;
}

export async function runCartReminders(): Promise<number> {
  if (!mailEnabled() || !getPricing().remind?.cart || !fs.existsSync(DIR)) return 0;
  let sent = 0; const now = Date.now();
  for (const n of fs.readdirSync(DIR)) {
    const f = path.join(DIR, n), e = readJSON<Entry | null>(f, null);
    if (!e || e.done || e.remindedAt) continue;
    const age = now - Date.parse(e.updatedAt);
    if (age < 22 * 36e5 || age > 7 * 864e5) continue;
    try {
      await sendMail({
        to: e.email, replyTo: process.env.INQUIRY_TO, subject: 'Ihr Warenkorb wartet noch auf Sie',
        html: layout({
          preheader: `${e.count} Teile gemerkt – Angebot mit einem Klick anfordern.`, title: 'Ihr Warenkorb',
          body: h1('Ihr Warenkorb ist noch da')
            + p(`Guten Tag${e.name ? ` ${esc(e.name)}` : ''},`)
            + p(`Sie hatten ${e.count} Teile in Ihrem Warenkorb gemerkt. Wir haben alles für Sie aufgehoben – mit einem Klick ist er wieder da und Sie können Ihr kostenloses Angebot anfordern.`)
            + button(`${shopUrl()}/warenkorb?teilen=${e.shareId}`, 'Warenkorb öffnen')
            + p('Fragen zu Größen, Veredelung oder Lieferzeit? Antworten Sie einfach auf diese E-Mail.', true)
            + signature()
            + p(`<a href="${shopUrl()}/api/warenkorb-erinnerung?abmelden=${e.token}" style="color:#6b7280">Keine Erinnerungen mehr erhalten</a>`, true),
        }),
      });
      writeJSON(f, { ...e, remindedAt: new Date().toISOString(), done: 'erinnert' });
      sent++;
    } catch (err) { console.error('Warenkorb-Erinnerung fehlgeschlagen', err); }
  }
  return sent;
}
