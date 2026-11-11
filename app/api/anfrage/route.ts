import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';
import { FONTS, METHODS, POSITIONS, TEXT_COLORS, decoLabel, type Deco } from '@/lib/deco';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, contactBlock, eur, h1, infoBox, itemsTable, layout, p, quote, signature, type MailLine } from '@/lib/mail-templates';
import { unitFor } from '@/lib/tiers';
import { discountFor, randomId, saveInquiry, validCode, type InqLine, type Inquiry } from '@/lib/store';

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
  const customer = Object.fromEntries(['name', 'company', 'email', 'phone', 'city', 'date', 'message'].map((k) => [k, String(c[k] ?? '').slice(0, 2000)]));

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

  const sub = body.code ? validCode(String(body.code)) : null;
  const discount = sub && discountFor(total) > 0 ? { code: sub.code!, pct: discountFor(total) } : null;
  const inq: Inquiry = { no, date: new Date().toISOString(), zugangscode: via, customer, lines, total, discount, status: 'neu', token: randomId(16), offer: null, history: [{ date: new Date().toISOString(), text: 'Anfrage eingegangen' }] };
  saveInquiry(inq); // immer lokal sichern (auch wenn Mail ausfällt)

  const base = shopUrl();
  const imgOf = new Map(raw.map(({ p }) => [p.id, p.images[0] ?? '']));
  const mlines: MailLine[] = lines.map((l) => ({ sku: l.sku, name: l.name, color: l.color, size: l.size, qty: l.qty, price: l.price, sum: l.sum, deco: l.deco ? decoLabel(l.deco) : undefined, note: l.deco?.note || undefined, image: imgOf.get(l.id!) ?? '' }));
  const pieces = lines.reduce((s, l) => s + l.qty, 0);
  const hasDeco = lines.some((l) => l.deco);
  const totals: [string, string, boolean?][] = discount
    ? [[`Summe Textil netto (${pieces} Stück)`, eur(total)], [`Willkommensrabatt ${discount.pct} %`, `−${eur(Math.round(total * discount.pct) / 100)}`], ['Richtwert netto', eur(total - Math.round(total * discount.pct) / 100), true]]
    : [[`Summe Textil netto (${pieces} Stück)`, eur(total), true]];
  const logos = [...new Map(lines.filter((l) => l.deco?.logoId).map((l) => [l.deco!.logoId!, l.deco!.logoName])).entries()];
  const dateTxt = customer.date ? new Date(customer.date).toLocaleDateString('de-DE') : '';

  const toShop = layout({
    preheader: `${customer.company || customer.name} · ${pieces} Stück · ${eur(total)}`, title: `Neue Anfrage ${no}`,
    body: h1(`Neue Anfrage ${no}`)
      + infoBox([['Kunde', esc(customer.company || customer.name)], ['Stückzahl', String(pieces)], ['Summe Textil netto', eur(total)], ...(dateTxt ? [['Wunschtermin', dateTxt] as [string, string]] : []), ...(via ? [['Zugangscode', esc(via)] as [string, string]] : []), ...(discount ? [['Rabattcode', `${discount.code} (${discount.pct} %)`] as [string, string]] : [])], '#ffc21a')
      + contactBlock(customer)
      + (customer.message ? `<div style="font-size:13px;font-weight:700;margin:0 0 6px">Nachricht</div>${quote(customer.message)}` : '')
      + itemsTable(mlines, totals)
      + (logos.length ? p(`<strong>Logos:</strong> ${logos.map(([id, n]) => `<a href="${base}/api/upload/${id}?download" style="color:#0a5cf0">${esc(n)}</a>`).join(', ')}`) : '')
      + button(`${base}/admin/anfrage/${no}`, 'Angebot erstellen →'),
  });
  const toCustomer = layout({
    preheader: `Wir haben Ihre Anfrage erhalten – Ihr Angebot folgt innerhalb von 24 Stunden.`, title: `Ihre Anfrage ${no}`,
    body: h1('Vielen Dank für Ihre Anfrage!')
      + p(`Guten Tag ${esc(customer.name)},`)
      + p(`wir haben Ihre Anfrage erhalten und erstellen Ihnen jetzt ein individuelles Angebot${hasDeco ? ' inklusive Veredelung' : ''}. Sie erhalten es <strong>innerhalb von 24 Stunden</strong> per E-Mail – mit einem Klick können Sie es dann online annehmen.`)
      + infoBox([['Anfrage-Nr.', no], ['Stückzahl', String(pieces)], ['Richtwert Textil netto', eur(total)], ...(dateTxt ? [['Ihr Wunschtermin', dateTxt] as [string, string]] : [])])
      + itemsTable(mlines, totals)
      + p(`Die angegebenen Preise sind Richtwerte zzgl. MwSt. Versand${hasDeco ? ' und Veredelung' : ''} kalkulieren wir im Angebot.`, true)
      + button(`${base}/konto`, 'Anfrage-Status ansehen')
      + p('Fragen oder Änderungen? Antworten Sie einfach auf diese E-Mail.')
      + signature(),
  });

  try {
    await sendMail({ to: process.env.INQUIRY_TO ?? '', replyTo: customer.email, subject: `Neue Anfrage ${no} – ${customer.company || customer.name} – ${eur(total)}`, html: toShop });
    await sendMail({ to: customer.email, replyTo: process.env.INQUIRY_TO, subject: `Ihre Anfrage ${no} bei ${process.env.SHOP_NAME ?? 'Euro-Trade'}`, html: toCustomer });
  } catch (e) {
    console.error('Mailversand fehlgeschlagen', e); // Anfrage ist trotzdem gespeichert
  }
  return NextResponse.json({ ok: true, no, token: inq.token });
}
