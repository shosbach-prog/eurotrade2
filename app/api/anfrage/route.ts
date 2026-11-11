import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/catalog';
import { eur } from '@/lib/format';
import { getCustomer } from '@/lib/customer';
import { FONTS, METHODS, POSITIONS, TEXT_COLORS, decoLabel, type Deco } from '@/lib/deco';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { unitFor } from '@/lib/tiers';
import { randomId, saveInquiry, type InqLine, type Inquiry } from '@/lib/store';

const hits = new Map<string, number[]>();

function cleanDeco(d: any): Deco | null {
  if (!d || typeof d !== 'object') return null;
  const positions = (Array.isArray(d.positions) ? d.positions : []).filter((x: string) => POSITIONS.includes(x));
  const method = METHODS.includes(d.method) ? d.method : METHODS[0];
  if (!positions.length) return null;
  const logoId = /^[a-f0-9]{24}$/.test(String(d.logoId ?? '')) ? String(d.logoId) : null;
  const text = String(d.text ?? '').replace(/\r/g, '').trim().slice(0, 120) || null;
  return {
    method, positions, motif: ['logo', 'text', 'beides'].includes(d.motif) ? d.motif : 'logo',
    logoId, logoName: logoId ? String(d.logoName ?? '').slice(0, 120) : null,
    text, font: text ? (FONTS.some((f) => f.id === d.font) ? d.font : FONTS[0].id) : null,
    textColor: text ? (TEXT_COLORS.some((c) => c.id === d.textColor) ? d.textColor : 'Schwarz') : null,
    note: String(d.note ?? '').slice(0, 1000),
  };
}

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
  const customer = Object.fromEntries(['name', 'company', 'email', 'phone', 'city', 'message'].map((k) => [k, String(c[k] ?? '').slice(0, 2000)]));

  // Preise serverseitig neu berechnen (mit Kunden-Aufschlag) – nie dem Browser vertrauen
  const ctx = await getCustomer();
  type Raw = { p: NonNullable<ReturnType<typeof getProduct>>; l: any; qty: number };
  const raw: Raw[] = (Array.isArray(body.lines) ? body.lines : []).slice(0, 300).flatMap((l: any) => {
    const p = getProduct(String(l.id), ctx);
    const qty = Math.max(1, Math.min(100000, Math.floor(Number(l.qty) || 1)));
    return p ? [{ p, l, qty }] : [];
  });
  // Staffelpreis nach Gesamtmenge je Artikel
  const perProduct = raw.reduce((m: Record<string, number>, x) => ({ ...m, [x.p.id]: (m[x.p.id] ?? 0) + x.qty }), {});
  const lines: InqLine[] = raw.map(({ p, l, qty }) => {
    const price = unitFor(p.tiers, perProduct[p.id], p.price);
    return { id: p.id, sku: p.sku, name: p.name, color: String(l.color ?? '').slice(0, 80), size: String(l.size ?? '').slice(0, 40), qty, price, sum: Math.round((price ?? 0) * qty * 100) / 100, deco: cleanDeco(l.deco) };
  });
  if (!lines.length) return NextResponse.json({ error: 'Warenkorb ist leer.' }, { status: 400 });
  const total = lines.reduce((s, l) => s + l.sum, 0);
  const no = `A${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomId(3).toUpperCase()}`;
  const via = ctx ? `${ctx.code}${ctx.name && ctx.name !== ctx.code ? ` (${ctx.name})` : ''}` : null;

  const inq: Inquiry = { no, date: new Date().toISOString(), zugangscode: via, customer, lines, total, status: 'neu', token: randomId(16), offer: null, history: [{ date: new Date().toISOString(), text: 'Anfrage eingegangen' }] };
  saveInquiry(inq); // immer lokal sichern (auch wenn Mail ausfällt)

  const base = shopUrl();
  const rows = lines.map((l) => `<tr><td>${esc(l.sku)}</td><td>${esc(l.name)}${l.deco ? `<br><small>✦ ${esc(decoLabel(l.deco))}${l.deco.note ? ` – ${esc(l.deco.note)}` : ''}</small>` : ''}</td><td>${esc(l.color)}</td><td>${esc(l.size)}</td><td align="right">${l.qty}</td><td align="right">${eur(l.price)}</td><td align="right">${l.price == null ? 'auf Anfrage' : eur(l.sum)}</td></tr>`).join('');
  const table = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font:13px Arial"><tr style="background:#eee"><th>Art.-Nr.</th><th>Artikel</th><th>Farbe</th><th>Größe</th><th>Menge</th><th>Einzel</th><th>Summe</th></tr>${rows}<tr><td colspan="6" align="right"><b>Summe netto (Textil)</b></td><td align="right"><b>${eur(total)}</b></td></tr></table>`;
  const logos = [...new Map(lines.filter((l) => l.deco?.logoId).map((l) => [l.deco!.logoId!, l.deco!.logoName])).entries()];
  const who = `<p><b>${esc(customer.name)}</b>${customer.company ? ` – ${esc(customer.company)}` : ''}<br>${esc(customer.email)} · ${esc(customer.phone)}<br>${esc(customer.city)}</p>${customer.message ? `<p><b>Nachricht:</b><br>${esc(customer.message).replace(/\n/g, '<br>')}</p>` : ''}${via ? `<p><b>Zugangscode:</b> ${esc(via)}</p>` : ''}`;

  try {
    await sendMail({ to: process.env.INQUIRY_TO ?? '', replyTo: customer.email, subject: `Neue Anfrage ${no} – ${customer.company || customer.name} – ${eur(total)}`,
      html: `<h2>Anfrage ${no}</h2>${who}${table}${logos.length ? `<p><b>Logos:</b> ${logos.map(([id, n]) => `<a href="${base}/api/upload/${id}?download">${esc(n)}</a>`).join(', ')}</p>` : ''}<p><a href="${base}/admin/anfrage/${no}">→ Im Admin öffnen und Angebot erstellen</a></p>` });
    await sendMail({ to: customer.email, subject: `Ihre Anfrage ${no} bei ${process.env.SHOP_NAME ?? 'Euro-Trade'}`,
      html: `<p>Guten Tag ${esc(customer.name)},</p><p>vielen Dank für Ihre Anfrage. Wir melden uns innerhalb von 24 Stunden mit Ihrem Angebot.</p>${table}<p>Mit freundlichen Grüßen<br>${esc(process.env.SHOP_NAME ?? 'Euro-Trade')}</p>` });
  } catch (e) {
    console.error('Mailversand fehlgeschlagen', e); // Anfrage ist trotzdem gespeichert
  }
  return NextResponse.json({ ok: true, no });
}
