import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import SystemTools from './SystemTools';
import { cronState, followDays } from '@/lib/followup';
import { listInquiries } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'System', robots: { index: false, follow: false } };

export default function System() {
  const e = process.env;
  const from = e.SMTP_FROM ?? e.SMTP_USER ?? '';
  const fromAddr = (from.match(/<([^>]+)>/)?.[1] ?? from).trim().toLowerCase();
  const warn: string[] = [];
  if (!e.SMTP_HOST) warn.push('SMTP_HOST fehlt – es werden keine E-Mails versendet.');
  if (e.SMTP_HOST && !e.SMTP_PASS) warn.push('SMTP_PASS ist leer.');
  if (e.SMTP_USER && fromAddr && fromAddr !== e.SMTP_USER.toLowerCase()) warn.push(`Absender (${fromAddr}) weicht vom Postfach (${e.SMTP_USER}) ab – IONOS lehnt das meist ab. Tipp: SMTP_FROM="Euro-Trade <${e.SMTP_USER}>"`);
  if (e.SMTP_HOST?.includes('ionos') && ![465, 587].includes(Number(e.SMTP_PORT ?? 587))) warn.push('Für IONOS Port 587 (oder 465) verwenden.');
  const st = cronState();
  const open = listInquiries().filter((i) => i.status === 'angebot' && i.offer?.sentAt && !i.remindedAt).length;
  return (
    <>
      <AdminNav active="system" />
      <h1>System</h1>
      <div className="sys-grid">
        <section className="box">
          <h2>E-Mail-Versand</h2>
          <dl className="sys-dl">
            <dt>Server</dt><dd>{e.SMTP_HOST || <span className="err">nicht gesetzt</span>}{e.SMTP_HOST && ` : ${e.SMTP_PORT ?? 587}`}</dd>
            <dt>Postfach</dt><dd>{e.SMTP_USER || <span className="err">nicht gesetzt</span>}</dd>
            <dt>Passwort</dt><dd>{e.SMTP_PASS ? '•••••••• (gesetzt)' : <span className="err">leer</span>}</dd>
            <dt>Absender</dt><dd>{from || '–'}</dd>
            <dt>Anfragen an</dt><dd>{e.INQUIRY_TO || <span className="err">nicht gesetzt</span>}</dd>
          </dl>
          {warn.map((w) => <p key={w} className="sys-warn">⚠ {w}</p>)}
          <SystemTools kind="mail" defaultTo={e.INQUIRY_TO ?? ''} />
        </section>
        <section className="box">
          <h2>Angebote nachfassen</h2>
          <p className="muted" style={{ marginTop: 0 }}>Wurde ein Angebot nach <b>{followDays()} Tagen</b> nicht angenommen, bekommt der Kunde automatisch eine freundliche Erinnerung (einmal, nur solange das Angebot gültig ist). Läuft automatisch einmal täglich am Vormittag.</p>
          <dl className="sys-dl">
            <dt>Offene Angebote</dt><dd>{open} ohne Erinnerung</dd>
            <dt>Letzter Lauf</dt><dd>{st.lastRun ? new Date(st.lastRun).toLocaleString('de-DE') : 'noch nie'}</dd>
            <dt>Ergebnis</dt><dd>{st.lastResult ?? '–'}</dd>
          </dl>
          <SystemTools kind="cron" />
        </section>
      </div>
    </>
  );
}
