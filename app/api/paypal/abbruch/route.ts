import { NextResponse } from 'next/server';
import { inquiryByToken } from '@/lib/store';
import { shopUrl } from '@/lib/mail';

export const dynamic = 'force-dynamic';

/** Kunde hat die Zahlung bei PayPal abgebrochen */
export function GET(req: Request) {
  const i = inquiryByToken(new URL(req.url).searchParams.get('t') ?? '');
  return NextResponse.redirect(i ? `${shopUrl()}/angebot/${i.token}?zahlung=abbruch` : `${shopUrl()}/`, 302);
}
