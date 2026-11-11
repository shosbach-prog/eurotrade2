import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { cronKey, runFollowUps } from '@/lib/followup';
import { runPaymentReminders } from '@/lib/invoice-actions';
import { runShippingChecks } from '@/lib/shipping';
import { runCartReminders } from '@/lib/cart-remind';

export const dynamic = 'force-dynamic';

/** Täglicher Lauf (Cron auf dem Server, mit Schlüssel aus data/cron-key) oder manuell als Admin */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key') ?? '';
  if (key !== cronKey() && !(await isAdmin())) return NextResponse.json({ error: 'Nicht erlaubt.' }, { status: 403 });
  const delivered = await runShippingChecks().catch(() => 0);
  const r = await runFollowUps();
  const pay = await runPaymentReminders().catch(() => ({ sent: 0 }));
  const carts = await runCartReminders().catch(() => 0);
  return NextResponse.json({ ok: true, ...r, result: `${r.result}${pay.sent ? `, ${pay.sent} Zahlungserinnerung(en)` : ''}${delivered ? `, ${delivered} Sendung(en) zugestellt` : ''}${carts ? `, ${carts} Warenkorb-Erinnerung(en)` : ''}`, payReminders: pay.sent });
}
