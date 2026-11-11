import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';

export const mailEnabled = () => !!process.env.SMTP_HOST;
const LOG = path.join(process.cwd(), 'data', 'mail-log.json');
export type MailLog = { date: string; to: string; subject: string; ok: boolean; error?: string; port?: number };
export const mailLog = (): MailLog[] => { try { return JSON.parse(fs.readFileSync(LOG, 'utf8')); } catch { return []; } };
function log(e: MailLog) { try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.writeFileSync(LOG, JSON.stringify([e, ...mailLog()].slice(0, 60), null, 1)); } catch {} }

/** Absender: muss bei IONOS & Co. zum Postfach passen – sonst wird die Mail abgelehnt. Anzeigename aus SMTP_FROM bleibt erhalten. */
export function senderAddress() {
  const user = process.env.SMTP_USER ?? '';
  const from = process.env.SMTP_FROM ?? user;
  const addr = (from.match(/<([^>]+)>/)?.[1] ?? from).trim();
  if (!user || addr.toLowerCase() === user.toLowerCase()) return from;
  const name = from.match(/^\s*"?([^"<]+?)"?\s*</)?.[1]?.trim() || process.env.SHOP_NAME || 'Euro-Trade';
  return `"${name}" <${user}>`;
}
/** Transport mit automatischem Ausweich-Port (587 STARTTLS ↔ 465 SSL), falls der eingestellte Port blockiert ist */
let goodPort: number | null = null;
export function transport(port: number) {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465, requireTLS: port === 587,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    // nie minutenlang hängen, wenn der Mailserver nicht antwortet
    connectionTimeout: 15_000, greetingTimeout: 10_000, socketTimeout: 30_000,
  });
}
export const ports = () => { const p = Number(process.env.SMTP_PORT ?? 587); return goodPort ? [goodPort] : [p, p === 465 ? 587 : 465]; };
export const netError = (e: any) => ['ESOCKET', 'ETIMEDOUT', 'ECONNECTION', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH'].includes(e?.code);

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string; replyTo?: string; attachments?: { filename: string; content: Buffer }[] }) {
  if (!mailEnabled()) { console.log(`[Mail nicht konfiguriert] ${opts.subject} -> ${opts.to}`); return false; }
  const { toText } = await import('./mail-templates');
  let last: any;
  for (const port of ports()) {
    try {
      await transport(port).sendMail({ from: senderAddress(), text: opts.text ?? toText(opts.html), ...opts });
      goodPort = port;
      log({ date: new Date().toISOString(), to: opts.to, subject: opts.subject, ok: true, port });
      return true;
    } catch (e: any) { last = e; if (!netError(e)) break; }
  }
  log({ date: new Date().toISOString(), to: opts.to, subject: opts.subject, ok: false, error: `${last?.code ?? ''} ${last?.response ?? last?.message ?? last}`.trim().slice(0, 300) });
  throw last;
}
/** Verständliche Erklärung zu Fehlern des Mailservers */
export function explainMailError(e: { code?: string | null; error?: string; response?: string | null }) {
  const t = `${e.code ?? ''} ${e.error ?? ''} ${e.response ?? ''}`;
  if (/EAUTH|535|authentication|auth/i.test(t)) return 'Anmeldung am Mailserver abgelehnt: SMTP_USER muss die komplette E-Mail-Adresse sein, SMTP_PASS das Passwort genau dieses Postfachs. Enthält das Passwort Sonderzeichen wie $ # " oder Leerzeichen, in der .env in einfache Anführungszeichen setzen: SMTP_PASS=\'…\'';
  if (/ETIMEDOUT|ESOCKET|ECONNREFUSED|ECONNECTION|EHOSTUNREACH|timeout/i.test(t)) return 'Server nicht erreichbar: Port 587 bzw. 465 ist vermutlich blockiert. Bei IONOS im Cloud Panel unter Netzwerk → Firewall ausgehend 587 und 465 erlauben, dann Container neu starten.';
  if (/ENOTFOUND|EAI_AGAIN/i.test(t)) return 'SMTP_HOST ist falsch geschrieben – für IONOS: smtp.ionos.de';
  if (/550|553|554|sender|from|envelope/i.test(t)) return 'Absender abgelehnt: Die Absender-Adresse muss genau das Postfach sein (SMTP_USER). Der Shop korrigiert das jetzt automatisch – bitte erneut testen.';
  if (/certificate|self signed|TLS|SSL/i.test(t)) return 'TLS-Problem: SMTP_PORT=587 verwenden (STARTTLS) oder 465 (SSL).';
  return 'Unbekannter Fehler – bitte die Meldung oben an den Support schicken.';
}
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export const shopUrl = () => (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
