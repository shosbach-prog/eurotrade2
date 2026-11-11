import { NextResponse } from 'next/server';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, h1, layout, p } from '@/lib/mail-templates';
import { inquiryByToken, listReviews, randomId, saveReviews, type Review } from '@/lib/store';

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const i = inquiryByToken(params.token);
  if (!i || !['angenommen', 'bestellt', 'geliefert'].includes(i.status ?? '')) return NextResponse.json({ error: 'Link ungültig.' }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? '').trim().slice(0, 40);
  if (!name) return NextResponse.json({ error: 'Bitte einen Namen angeben.' }, { status: 400 });
  const company = String(b.company ?? '').trim().slice(0, 80);
  const clean = (e: any) => ({ rating: Math.max(0, Math.min(5, Math.round(Number(e?.rating) || 0))), title: String(e?.title ?? '').trim().slice(0, 80), text: String(e?.text ?? '').trim().slice(0, 1000) });
  const products = new Map(i.lines.filter((l) => l.id).map((l) => [l.id!, l]));
  const now = new Date().toISOString();
  const fresh: Review[] = [];
  const s = clean(b.shop);
  if (s.rating) fresh.push({ id: randomId(6), productId: null, name, company, ...s, date: now, inquiryNo: i.no, status: 'pending' });
  for (const [id, e] of Object.entries(b.items ?? {})) {
    const l = products.get(id); const c = clean(e);
    if (l && c.rating) fresh.push({ id: randomId(6), productId: id, sku: l.sku, productName: l.name, name, company, ...c, date: now, inquiryNo: i.no, status: 'pending' });
  }
  if (!fresh.length) return NextResponse.json({ error: 'Bitte mindestens eine Sternebewertung vergeben.' }, { status: 400 });
  // pro Auftrag und Produkt nur eine Bewertung – neue ersetzt eine noch nicht veröffentlichte
  const keep = listReviews().filter((r) => !(r.inquiryNo === i.no && fresh.some((f) => f.productId === r.productId) && r.status === 'pending'));
  const dup = keep.some((r) => r.inquiryNo === i.no && fresh.some((f) => f.productId === r.productId));
  if (dup) return NextResponse.json({ error: 'Sie haben diesen Auftrag bereits bewertet. Vielen Dank!' }, { status: 409 });
  saveReviews([...keep, ...fresh]);
  try {
    await sendMail({ to: process.env.INQUIRY_TO ?? '', subject: `Neue Bewertung (${fresh.map((f) => '★'.repeat(f.rating)).join(' / ')}) – ${i.customer.company || i.customer.name}`,
      html: layout({ preheader: `${fresh.length} neue Bewertung(en) warten auf Freigabe`, title: 'Neue Bewertung',
        body: h1('Neue Bewertung zur Freigabe') + fresh.map((f) => p(`<span style="color:#ffb300;font-size:18px">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span> <strong>${esc(f.productName ?? 'Shop/Service')}</strong>${f.title ? `<br><strong>${esc(f.title)}</strong>` : ''}${f.text ? `<br>${esc(f.text)}` : ''}`)).join('')
          + button(`${shopUrl()}/admin/bewertungen`, 'Prüfen & freigeben →') }) });
  } catch (e) { console.error('Mail Bewertung fehlgeschlagen', e); }
  return NextResponse.json({ ok: true });
}
