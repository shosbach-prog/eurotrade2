import { NextResponse } from 'next/server';
import { esc, sendMail, shopUrl } from '@/lib/mail';
import { button, h1, infoBox, layout, quote } from '@/lib/mail-templates';
import { addHistory, inquiryByToken, saveInquiry } from '@/lib/store';

/** Kunde gibt den Korrekturabzug frei oder wünscht eine Änderung */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const i = inquiryByToken(params.token);
  if (!i?.proof?.sentAt) return NextResponse.json({ error: 'Keine Vorschau zur Freigabe.' }, { status: 404 });
  const { action, name, text } = await req.json().catch(() => ({}));
  const who = String(name ?? '').trim().slice(0, 100);
  if (!who) return NextResponse.json({ error: 'Bitte Ihren Namen angeben.' }, { status: 400 });
  if (i.proof.approvedAt) return NextResponse.json({ ok: true, already: true });
  const now = new Date().toISOString();
  if (action === 'ok') {
    i.proof.approvedAt = now; i.proof.approvedBy = who;
    addHistory(i, `Druck-/Stickfreigabe erteilt von ${who}`);
  } else {
    const t = String(text ?? '').trim().slice(0, 2000);
    if (!t) return NextResponse.json({ error: 'Bitte beschreiben Sie die Änderung.' }, { status: 400 });
    i.proof.changes = [...(i.proof.changes ?? []), { date: now, text: `${who}: ${t}` }];
    i.proof.sentAt = null; // neue Vorschau nötig
    addHistory(i, `Änderungswunsch zur Vorschau von ${who}: „${t}“`);
  }
  saveInquiry(i);
  const ok = action === 'ok';
  try {
    await sendMail({ to: process.env.INQUIRY_TO ?? '', replyTo: i.customer.email, subject: `${ok ? '✓ Freigabe erteilt' : '✎ Änderungswunsch'} – ${i.no} – ${i.customer.company || i.customer.name}`,
      html: layout({ preheader: ok ? 'Die Produktion kann starten.' : 'Der Kunde wünscht eine Änderung an der Vorschau.', title: `Freigabe ${i.no}`,
        body: h1(ok ? '✓ Druck-/Stickfreigabe erteilt' : '✎ Änderungswunsch zur Vorschau')
          + infoBox([['Auftrag', i.no], ['Kunde', esc(i.customer.company || i.customer.name)], ['Von', esc(who)]], ok ? '#1d7a3e' : '#ffc21a')
          + (!ok ? quote(String(text)) : '')
          + button(`${shopUrl()}/admin/anfrage/${i.no}`, 'Im Admin öffnen →') }) });
  } catch (e) { console.error('Mail zur Freigabe fehlgeschlagen', e); }
  return NextResponse.json({ ok: true });
}
