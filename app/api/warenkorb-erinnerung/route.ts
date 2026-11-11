import { NextResponse } from 'next/server';
import { cleanSharedLines } from '@/lib/shared-cart';
import { rememberCart, unsubscribeCart } from '@/lib/cart-remind';

/** Warenkorb merken (nur mit Einwilligung) */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (b?.consent !== true) return NextResponse.json({ error: 'Einwilligung fehlt.' }, { status: 400 });
  const ok = rememberCart(String(b.email ?? ''), String(b.name ?? ''), cleanSharedLines(b.lines));
  return NextResponse.json({ ok });
}
/** Abmelden per Link aus der Mail */
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('abmelden') ?? '';
  const ok = unsubscribeCart(t);
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Abgemeldet</title><body style="font-family:system-ui,sans-serif;max-width:520px;margin:60px auto;padding:0 16px;color:#14181f"><h1 style="font-size:22px">${ok ? 'Sie erhalten keine Warenkorb-Erinnerungen mehr.' : 'Link ungültig oder bereits abgemeldet.'}</h1><p><a href="/" style="color:#0b5cff">Zur Startseite</a></p></body>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
