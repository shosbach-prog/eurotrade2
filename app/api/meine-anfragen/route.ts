import { NextResponse } from 'next/server';
import { STATUS, inquiryByToken, offerTotals } from '@/lib/store';

/** Status der eigenen Anfragen – nur mit dem geheimen Token, das der Browser beim Absenden erhalten hat */
export async function POST(req: Request) {
  const { tokens } = await req.json().catch(() => ({}));
  const list = (Array.isArray(tokens) ? tokens : []).slice(0, 50).map(String).flatMap((t) => {
    const i = inquiryByToken(t);
    if (!i) return [];
    return [{
      no: i.no, date: i.date, status: i.status, statusLabel: STATUS[i.status ?? 'neu'],
      pieces: i.lines.reduce((s, l) => s + l.qty, 0), total: i.total,
      offer: i.offer?.sentAt ? { gross: offerTotals(i.offer).gross, url: `/angebot/${t}` } : null,
      lines: i.lines.map((l) => ({ id: l.id, name: l.name, color: l.color, size: l.size, qty: l.qty, deco: l.deco ?? null })),
    }];
  });
  return NextResponse.json(list, { headers: { 'Cache-Control': 'private, no-store' } });
}

export const dynamic = 'force-dynamic';
