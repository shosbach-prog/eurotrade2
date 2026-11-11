import { NextResponse } from 'next/server';
import { sendConfirm } from '@/lib/newsletter';
import { listSubscribers, randomId, saveSubscribers } from '@/lib/store';

const hits = new Map<string, number[]>();

/** Anmeldung (Double-Opt-in): speichert unbestätigt und sendet Bestätigungslink */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= 5) return NextResponse.json({ error: 'Zu viele Versuche – bitte später erneut.' }, { status: 429 });
  hits.set(ip, [...recent, now]);
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true });
  const email = String(b.email ?? '').trim().toLowerCase().slice(0, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return NextResponse.json({ error: 'Bitte eine gültige E-Mail-Adresse eingeben.' }, { status: 400 });
  if (!b.privacy) return NextResponse.json({ error: 'Bitte der Datenschutzerklärung zustimmen.' }, { status: 400 });
  // unbestätigte Anmeldungen nach 30 Tagen löschen (siehe Datenschutzerklärung)
  const list = listSubscribers().filter((x) => x.confirmed || Date.now() - new Date(x.date).getTime() < 30 * 86400000);
  let s = list.find((x) => x.email === email);
  if (s?.confirmed && !s.unsubscribedAt) return NextResponse.json({ ok: true, already: true });
  if (!s) { s = { id: randomId(6), email, type: String(b.type ?? '').slice(0, 40), date: new Date().toISOString(), token: randomId(16), confirmed: false }; list.push(s); }
  else { s.token = randomId(16); s.unsubscribedAt = null; s.confirmed = false; if (b.type) s.type = String(b.type).slice(0, 40); }
  saveSubscribers(list);
  try { await sendConfirm(s); } catch (e) { console.error('Newsletter-Bestätigung fehlgeschlagen', e); return NextResponse.json({ error: 'Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte später erneut versuchen.' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
