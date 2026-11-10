import 'server-only';
import nodemailer from 'nodemailer';

export const mailEnabled = () => !!process.env.SMTP_HOST;
export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string; attachments?: { filename: string; content: Buffer }[] }) {
  if (!mailEnabled()) { console.log(`[Mail nicht konfiguriert] ${opts.subject} -> ${opts.to}`); return false; }
  const tx = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await tx.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, ...opts });
  return true;
}
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export const shopUrl = () => (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
