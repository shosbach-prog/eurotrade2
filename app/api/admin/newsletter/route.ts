import { isAdmin } from '@/lib/customer';
import { listSubscribers } from '@/lib/store';
/** CSV-Export der bestätigten Empfänger (z. B. für Brevo/CleverReach) */
export async function GET() {
  if (!(await isAdmin())) return new Response('Nicht angemeldet', { status: 401 });
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = listSubscribers().filter((s) => s.confirmed && !s.unsubscribedAt)
    .map((s) => [s.email, s.type, s.confirmedAt, s.code, s.usedAt ? 'ja' : 'nein'].map(q).join(';'));
  return new Response('﻿' + ['E-Mail;Typ;Bestätigt am;Rabattcode;Eingelöst', ...rows].join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
export const dynamic = 'force-dynamic';
