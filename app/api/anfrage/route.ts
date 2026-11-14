import { NextResponse } from 'next/server';
import { adminProduct, getProduct } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';
import { FONTS, METHODS, POSITIONS, TEAM_POS, TEXT_COLORS, decoLabel, teamLabel, type Deco } from '@/lib/deco';
import { getTeamShop, isDirectShop, teamFixedPrice, teamShippingGross } from '@/lib/teamshop';
import { paypalEnabled } from '@/lib/paypal';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, contactBlock, eur, h1, infoBox, itemsTable, layout, p, quote, signature, type MailLine } from '@/lib/mail-templates';
import { sizeUnit } from '@/lib/tiers';
import { discountFor, draftOffer, offerTotals, randomId, saveInquiry, validCode, type InqLine, type Inquiry } from '@/lib/store';
import { cartDone } from '@/lib/cart-remind';

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
    ...(() => {
      const lg: Record<string, { id: string; name: string }> = {};
      if (d.logos && typeof d.logos === 'object') for (const p of positions) { const x = d.logos[p]; if (x && /^[a-f0-9]{24}$/.test(String(x.id ?? ''))) lg[p] = { id: String(x.id), name: String(x.name ?? '').slice(0, 120) }; }
      return Object.keys(lg).length ? { logos: lg } : {};
    })(),
    text, font: text ? (FONTS.some((f) => f.id === d.font) ? d.font : FONTS[0].id) : null,
    textColor: text ? (TEXT_COLORS.some((c) => c.id === d.textColor) ? d.textColor : 'Schwarz') : null,
    note: String(d.note ?? '').slice(0, 1000),
    ...(() => {
      // Lage aus der Live-Vorschau (nur bekannte Positionen, Werte begrenzt)
      const num = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isFinite(n) ? Math.round(Math.min(hi, Math.max(lo, n)) * 10) / 10 : null; };
      const place: Record<string, { x: number; y: number; w: number }> = {}, sizes: Record<string, number> = {};
      for (const pos of positions) {
        const pl = d.place?.[pos], cm = num(d.sizes?.[pos], 1, 80);
        if (pl) { const x = num(pl.x, 0, 100), y = num(pl.y, 0, 100), w = num(pl.w, 1, 100); if (x != null && y != null && w != null) place[pos] = { x, y, w }; }
        if (cm != null) sizes[pos] = Math.round(cm);
      }
      return { place: Object.keys(place).length ? place : undefined, sizes: Object.keys(sizes).length ? sizes : undefined };
    })(),
    previews: (Array.isArray(d.previews) ? d.previews : []).map(String).filter((x: string) => /^[a-f0-9]{24}$/.test(x)).slice(0, 4),
    team: (() => {
      const rows = (Array.isArray(d.team?.rows) ? d.team.rows : []).slice(0, 300).map((r: any) => ({ name: String(r?.name ?? '').slice(0, 30).trim(), nr: String(r?.nr ?? '').replace(/\D/g, '').slice(0, 3), size: String(r?.size ?? '').slice(0, 20) })).filter((r: any) => r.name || r.nr);
      if (!rows.length) return null;
      return { rows, pos: (TEAM_POS as readonly string[]).includes(d.team?.pos) ? d.team.pos : 'Rücken', what: ['name', 'nummer', 'beides'].includes(d.team?.what) ? d.team.what : 'beides' };
    })(),
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
  const customer = Object.fromEntries(['name', 'company', 'email', 'phone', 'street', 'city', 'date', 'message'].map((k) => [k, String(c[k] ?? '').slice(0, 2000)]));

  // Preise serverseitig neu berechnen (mit Kunden-Aufschlag) – nie dem Browser vertrauen
  const ctx = await getCustomer();
  type Raw = { p: NonNullable<ReturnType<typeof getProduct>>; l: any; qty: number };
  const raw: Raw[] = (Array.isArray(body.lines) ? body.lines : []).slice(0, 300).flatMap((l: any) => {
    const p = getProduct(String(l.id), ctx);
    const qty = Math.max(1, Math.min(100000, Math.floor(Number(l.qty) || 1)));
    return p ? [{ p, l, qty }] : [];
  });
  // Motiv-/Team-Shop mit Festpreis inkl. Druck
  const team = body.team ? getTeamShop(String(body.team)) : null;
  // Staffelpreis nach Gesamtmenge je Artikel
  const perProduct = raw.reduce((m: Record<string, number>, x) => ({ ...m, [x.p.id]: (m[x.p.id] ?? 0) + x.qty }), {});
  const lines: InqLine[] = raw.map(({ p, l, qty }) => {
    const fixed = teamFixedPrice(team, p.id);
    // Rückendruck-Option: Shop-Logo auf dem Rücken (nicht bereits feste Position) kostet den Aufpreis
    const back = fixed != null && team?.backPrice && team.logoId && !team.positions.includes('Rücken') && l.deco?.logos?.['Rücken']?.id === team.logoId && Array.isArray(l.deco?.positions) && l.deco.positions.includes('Rücken') ? team.backPrice : 0;
    const price = fixed != null ? Math.round((fixed + back + (p.sizeUp?.[String(l.size ?? '')] ?? 0)) * 100) / 100 : sizeUnit(p.tiers, perProduct[p.id], p.price, p.sizeUp, String(l.size ?? ''));
    const sample = !!l.sample;
    const ek = adminProduct(p.id).p?.basePrice ?? null;
    return { id: p.id, sku: p.sku, name: p.name, color: String(l.color ?? '').slice(0, 80), size: String(l.size ?? '').slice(0, 40), qty: sample ? 1 : qty, price, sum: Math.round((price ?? 0) * (sample ? 1 : qty) * 100) / 100, deco: cleanDeco(l.deco), ek, ...(sample ? { sample: true } : {}), ...(fixed != null && l.deco ? { incl: true } : {}) };
  });
  if (!lines.length) return NextResponse.json({ error: 'Warenkorb ist leer.' }, { status: 400 });
  // Einzelversand-Shop: alle Positionen aus dem Shop zum Festpreis → direkte Bestellung (Lieferadresse nötig)
  const direct = isDirectShop(team) && lines.every((l) => l.id && teamFixedPrice(team, l.id) != null && !l.sample);
  if (direct && (!customer.street?.trim() || !customer.city?.trim())) return NextResponse.json({ error: 'Bitte Straße sowie PLZ/Ort für den Versand angeben.' }, { status: 400 });
  const total = lines.reduce((s, l) => s + l.sum, 0);
  const no = `A${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomId(3).toUpperCase()}`;
  const via = ctx ? `${ctx.code}${ctx.name && ctx.name !== ctx.code ? ` (${ctx.name})` : ''}` : null;

  const sub = body.code ? validCode(String(body.code)) : null;
  const discount = sub && discountFor(total) > 0 ? { code: sub.code!, pct: discountFor(total) } : null;
  const inq: Inquiry = { no, date: new Date().toISOString(), zugangscode: via, customer, lines, total, discount, status: 'neu', token: randomId(16), offer: null, team: team?.slug ?? null, history: [{ date: new Date().toISOString(), text: team ? `Anfrage über Team-Shop „${team.name}“ eingegangen` : 'Anfrage eingegangen' }] };
  if (direct && team) {
    // Preis steht fest: Angebot sofort erstellen (inkl. Versandpauschale) – Kunde bezahlt direkt (PayPal) oder bestätigt online
    const offer = draftOffer(inq);
    const goodsGross = offerTotals({ ...offer, shipping: 0 }).gross;
    offer.shipping = Math.round((teamShippingGross(team, goodsGross) / (1 + offer.vat / 100)) * 100) / 100;
    offer.note = `Direktbestellung über ${team.name} – Druck im Preis enthalten, Versand direkt an Sie.`;
    offer.sentAt = new Date().toISOString();
    inq.direct = true; inq.offer = offer; inq.status = 'angebot';
    inq.history = [...(inq.history ?? []), { date: new Date().toISOString(), text: `Direktbestellung – Gesamt ${eur(offerTotals(offer).gross)} brutto` }];
  }
  saveInquiry(inq); // immer lokal sichern (auch wenn Mail ausfällt)
  try { cartDone(customer.email); } catch {}

  const base = shopUrl();
  const abs = (u?: string) => (u && u.startsWith('/') ? `${base}${u}` : u ?? '');
  const imgOf = new Map(raw.map(({ p }) => [p.id, abs(p.images[0])]));
  const mlines: MailLine[] = lines.map((l) => ({ sku: l.sku, name: `${l.sample ? 'MUSTER · ' : ''}${l.name}`, color: l.color, size: l.size, qty: l.qty, price: l.price, sum: l.sum, deco: l.deco ? decoLabel(l.deco) : undefined, note: [l.deco?.note, teamLabel(l.deco?.team?.rows)].filter(Boolean).join(' · ') || undefined, image: (l.deco?.previews?.[0] ? `${base}/api/upload/${l.deco.previews[0]}` : imgOf.get(l.id!)) ?? '' }));
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
      + infoBox([['Kunde', esc(customer.company || customer.name)], ['Stückzahl', String(pieces)], ['Summe Textil netto', eur(total)], ...(team ? [['Team-Shop', esc(team.name)] as [string, string]] : []), ...(lines.some((l) => l.sample) ? [['Muster', 'ja – wird angerechnet'] as [string, string]] : []), ...(dateTxt ? [['Wunschtermin', dateTxt] as [string, string]] : []), ...(via ? [['Zugangscode', esc(via)] as [string, string]] : []), ...(discount ? [['Rabattcode', `${discount.code} (${discount.pct} %)`] as [string, string]] : [])], '#ffc21a')
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
      + button(`${base}/angebot/${inq.token}`, 'Status Ihrer Anfrage ansehen')
      + p('Fragen oder Änderungen? Antworten Sie einfach auf diese E-Mail.')
      + signature(),
  });

  const payNow = direct && paypalEnabled();
  const directMail = inq.offer && direct ? layout({
    preheader: `Gesamt ${eur(offerTotals(inq.offer).gross)} inkl. MwSt. und Versand`, title: `Ihre Bestellung ${no}`,
    body: h1('Vielen Dank für Ihre Bestellung!')
      + p(`Guten Tag ${esc(customer.name)},`)
      + p(payNow ? `Ihre Bestellung <strong>${no}</strong> ist angelegt. Falls die Zahlung noch nicht abgeschlossen ist, können Sie sie hier jederzeit nachholen.` : `Ihre Bestellung <strong>${no}</strong> ist angelegt. Bitte bestätigen Sie sie mit einem Klick – danach geht sie in Produktion.`)
      + infoBox([['Bestell-Nr.', no], ['Stückzahl', String(pieces)], ['Gesamt inkl. MwSt. und Versand', eur(offerTotals(inq.offer).gross)], ['Lieferadresse', esc(`${customer.street}, ${customer.city}`)]])
      + itemsTable(mlines.map((m) => ({ ...m, price: m.price != null ? Math.round(m.price * (1 + inq.offer!.vat / 100) * 100) / 100 : null, sum: Math.round(m.sum * (1 + inq.offer!.vat / 100) * 100) / 100 })), [['Versand', eur(Math.round(inq.offer.shipping * (1 + inq.offer.vat / 100) * 100) / 100)], ['Gesamt inkl. MwSt.', eur(offerTotals(inq.offer).gross), true]])
      + button(payNow ? `${base}/api/paypal/start?t=${inq.token}` : `${base}/angebot/${inq.token}`, payNow ? 'Jetzt mit PayPal bezahlen' : 'Bestellung ansehen & bestätigen')
      + p('Fragen? Antworten Sie einfach auf diese E-Mail.')
      + signature(),
  }) : null;

  try {
    await sendMail({ to: process.env.INQUIRY_TO ?? '', replyTo: customer.email, subject: `${direct ? 'Neue Bestellung' : 'Neue Anfrage'} ${no} – ${customer.company || customer.name} – ${eur(total)}`, html: toShop });
    await sendMail({ to: customer.email, replyTo: process.env.INQUIRY_TO, subject: directMail ? `Ihre Bestellung ${no} bei ${process.env.SHOP_NAME ?? 'Euro-Trade'}` : `Ihre Anfrage ${no} bei ${process.env.SHOP_NAME ?? 'Euro-Trade'}`, html: directMail ?? toCustomer });
  } catch (e) {
    console.error('Mailversand fehlgeschlagen', e); // Anfrage ist trotzdem gespeichert
  }
  return NextResponse.json({ ok: true, no, token: inq.token, ...(direct ? { direct: true } : {}), ...(payNow && body.pay === 'paypal' ? { redirect: `/api/paypal/start?t=${inq.token}` } : {}) });
}
