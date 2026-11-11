import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { explainMailError, netError, ports, senderAddress, transport } from '@/lib/mail';

/** Testmail senden – probiert beide Ports und erklärt den Fehler verständlich */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const to = String(b?.to || process.env.INQUIRY_TO || '').trim();
  if (!process.env.SMTP_HOST) return NextResponse.json({ ok: false, step: 'config', error: 'SMTP_HOST ist in der .env nicht gesetzt.', hint: 'In der .env eintragen: SMTP_HOST=smtp.ionos.de, SMTP_PORT=587, SMTP_USER=info@euro-trade.com, SMTP_PASS=… und danach den Container neu starten.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return NextResponse.json({ ok: false, step: 'config', error: 'Keine gültige Empfänger-Adresse (INQUIRY_TO).' });
  const tried: string[] = [];
  let fail: any = null, step = 'login';
  for (const port of [...new Set([...ports(), 587, 465])]) {
    const tx = transport(port);
    try { step = 'login'; await tx.verify(); } catch (e: any) { tried.push(`Port ${port}: ${e?.code ?? ''} ${e?.response ?? e?.message ?? ''}`.trim()); fail = e; if (netError(e)) continue; break; }
    try {
      step = 'send';
      await tx.sendMail({ from: senderAddress(), to, subject: 'Testmail von euro-trade.com', text: `Der Mailversand funktioniert (Port ${port}).\n\nGesendet: ${new Date().toLocaleString('de-DE')}` });
      const fix = port !== Number(process.env.SMTP_PORT ?? 587) ? ` Hinweis: Funktioniert nur über Port ${port} – bitte SMTP_PORT=${port} in die .env eintragen.` : '';
      return NextResponse.json({ ok: true, to, port, hint: fix || undefined });
    } catch (e: any) { fail = e; tried.push(`Port ${port}: ${e?.code ?? ''} ${e?.response ?? e?.message ?? ''}`.trim()); break; }
  }
  const out = { ok: false, step, error: String(fail?.message ?? fail), code: fail?.code ?? null, response: fail?.response ?? null, tried };
  return NextResponse.json({ ...out, hint: explainMailError(out) });
}
