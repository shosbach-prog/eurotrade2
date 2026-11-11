import { NextResponse } from 'next/server';
import { STATUS, inquiryByToken, listInquiries, offerTotals, type Inquiry } from '@/lib/store';
import { getCustomer } from '@/lib/customer';

/** Status der eigenen Anfragen – nur mit dem geheimen Token, das der Browser beim Absenden erhalten hat */
export async function POST(req: Request) {
  const { tokens } = await req.json().catch(() => ({}));
  // Angemeldete Kunden: alle Anfragen ihres Zugangs (geräteübergreifend) + die auf diesem Gerät gespeicherten
  const customer = await getCustomer();
  const found = new Map<string, Inquiry>();
  for (const t of (Array.isArray(tokens) ? tokens : []).slice(0, 50).map(String)) { const i = inquiryByToken(t); if (i) found.set(i.no, i); }
  if (customer) for (const i of listInquiries()) if (i.zugangscode && i.zugangscode === customer.code) found.set(i.no, i);
  const list = [...found.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100).map((i) => ({
    no: i.no, date: i.date, status: i.status, statusLabel: STATUS[i.status ?? 'neu'],
    pieces: i.lines.reduce((s, l) => s + l.qty, 0), total: i.total,
    offer: i.offer?.sentAt && i.token ? { gross: offerTotals(i.offer).gross, url: `/angebot/${i.token}` } : null,
    url: i.token ? `/angebot/${i.token}` : null,
    lines: i.lines.map((l) => ({ id: l.id, name: l.name, color: l.color, size: l.size, qty: l.qty, deco: l.deco ?? null, sample: l.sample })),
  }));
  return NextResponse.json(list, { headers: { 'Cache-Control': 'private, no-store' } });
}

export const dynamic = 'force-dynamic';
