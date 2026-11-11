import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { getInquiry, listReviews, randomId, saveReviews, type Review } from '@/lib/store';

/** Bewertung freigeben/ablehnen/beantworten – Inhalte der Kunden werden nicht verändert */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const { id, status, reply, incentive } = await req.json().catch(() => ({}));
  const list = listReviews();
  const r = list.find((x) => x.id === id);
  if (!r) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 });
  if (['pending', 'approved', 'rejected'].includes(status)) r.status = status;
  if (typeof reply === 'string') r.reply = reply.trim().slice(0, 800) || undefined;
  if (incentive !== undefined) r.incentive = String(incentive ?? '').trim().slice(0, 80) || null;
  saveReviews(list);
  return NextResponse.json({ ok: true });
}

/** Bewertung erfassen, die per E-Mail/Telefon/persönlich kam – nur mit echtem Auftrag und Zustimmung */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const i = getInquiry(String(b.inquiryNo ?? ''));
  if (!i || !['angenommen', 'bestellt', 'geliefert'].includes(i.status ?? '')) return NextResponse.json({ error: 'Nur zu angenommenen/gelieferten Aufträgen möglich.' }, { status: 400 });
  if (!b.consent) return NextResponse.json({ error: 'Bitte die Zustimmung des Kunden zur Veröffentlichung bestätigen.' }, { status: 400 });
  const rating = Math.round(Number(b.rating));
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: 'Bitte 1–5 Sterne wählen.' }, { status: 400 });
  const line = b.productId ? i.lines.find((l) => l.id === b.productId) : null;
  if (b.productId && !line) return NextResponse.json({ error: 'Artikel gehört nicht zu diesem Auftrag.' }, { status: 400 });
  const r: Review = {
    id: randomId(6), productId: line?.id ?? null, sku: line?.sku, productName: line?.name,
    name: String(b.name ?? '').trim().slice(0, 40) || i.customer.name, company: String(b.company ?? '').trim().slice(0, 80),
    rating, title: String(b.title ?? '').trim().slice(0, 80), text: String(b.text ?? '').trim().slice(0, 1000),
    date: new Date().toISOString(), inquiryNo: i.no, status: 'approved',
    source: (['email', 'telefon', 'persoenlich'].includes(b.source) ? b.source : 'email'), incentive: String(b.incentive ?? '').trim().slice(0, 80) || null,
  };
  saveReviews([...listReviews(), r]);
  return NextResponse.json({ ok: true, review: r });
}
