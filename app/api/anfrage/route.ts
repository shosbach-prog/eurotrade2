import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { getProduct } from '@/lib/catalog';
import { eur } from '@/lib/format';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, codeForToken } from '@/lib/access';

const hits = new Map<string, number[]>();
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export async function POST(req: Request) {
  // einfacher Spam-Schutz: max. 5 Anfragen / 10 Min. pro IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (recent.length >= 5) return NextResponse.json({ error: 'Zu viele Anfragen – bitte später erneut versuchen.' }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const body = await req.json().catch(() => null);
  const c = body?.customer ?? {};
  if (c.website) return NextResponse.json({ ok: true }); // Honeypot
  if (!c.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email ?? '')) return NextResponse.json({ error: 'Bitte Name und gültige E-Mail angeben.' }, { status: 400 });

  // Preise serverseitig neu berechnen – nie dem Browser vertrauen
  const lines = (Array.isArray(body.lines) ? body.lines : []).slice(0, 200).flatMap((l: any) => {
    const p = getProduct(String(l.id));
    const qty = Math.max(1, Math.min(100000, Math.floor(Number(l.qty) || 1)));
    return p ? [{ sku: p.sku, name: p.name, color: String(l.color ?? ''), size: String(l.size ?? ''), qty, price: p.price, sum: (p.price ?? 0) * qty }] : [];
  });
  if (!lines.length) return NextResponse.json({ error: 'Warenkorb ist leer.' }, { status: 400 });
  const total = lines.reduce((s: number, l: any) => s + l.sum, 0);
  const access = await codeForToken(cookies().get(ACCESS_COOKIE)?.value);
  const via = access ? `${access.code}${access.label ? ` (${access.label})` : ''}` : '';
  const no = `A${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Immer lokal sichern (auch wenn Mail ausfällt)
  const dir = path.join(process.cwd(), 'data', 'anfragen');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${no}.json`), JSON.stringify({ no, date: new Date().toISOString(), zugangscode: via || null, customer: c, lines, total }, null, 2));

  const rows = lines.map((l: any) => `<tr><td>${esc(l.sku)}</td><td>${esc(l.name)}</td><td>${esc(l.color)}</td><td>${esc(l.size)}</td><td align="right">${l.qty}</td><td align="right">${eur(l.price)}</td><td align="right">${l.price == null ? "auf Anfrage" : eur(l.sum)}</td></tr>`).join('');
  const table = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font:13px Arial"><tr style="background:#eee"><th>Art.-Nr.</th><th>Artikel</th><th>Farbe</th><th>Größe</th><th>Menge</th><th>Einzel</th><th>Summe</th></tr>${rows}<tr><td colspan="6" align="right"><b>Summe netto</b></td><td align="right"><b>${eur(total)}</b></td></tr></table>`;
  const customer = `<p><b>${esc(c.name)}</b>${c.company ? ` – ${esc(c.company)}` : ''}<br>${esc(c.email)} · ${esc(c.phone)}<br>${esc(c.city)}</p><p><b>Nachricht:</b><br>${esc(c.message).replace(/\n/g, '<br>')}</p>${via ? `<p><b>Zugangscode:</b> ${esc(via)}</p>` : ''}`;

  if (process.env.SMTP_HOST) {
    try {
      const tx = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
      await tx.sendMail({ from, to: process.env.INQUIRY_TO, replyTo: c.email, subject: `Neue Anfrage ${no} – ${c.company || c.name} – ${eur(total)}`, html: `<h2>Anfrage ${no}</h2>${customer}${table}` });
      await tx.sendMail({ from, to: c.email, subject: `Ihre Anfrage ${no} bei ${process.env.SHOP_NAME ?? 'Euro-Trade'}`, html: `<p>Guten Tag ${esc(c.name)},</p><p>vielen Dank für Ihre Anfrage. Wir melden uns innerhalb von 24 Stunden mit Ihrem Angebot.</p>${table}<p>Mit freundlichen Grüßen<br>${esc(process.env.SHOP_NAME ?? 'Euro-Trade')}</p>` });
    } catch (e) {
      console.error('Mailversand fehlgeschlagen', e); // Anfrage ist trotzdem gespeichert
    }
  } else {
    console.log(`[Anfrage ${no}] SMTP nicht konfiguriert – gespeichert in data/anfragen/${no}.json`);
  }
  return NextResponse.json({ ok: true, no });
}
