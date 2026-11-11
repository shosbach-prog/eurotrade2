import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import SystemTools from './SystemTools';
import { cronState, followDays } from '@/lib/followup';
import { listInquiries } from '@/lib/store';
import { mailLog, senderAddress } from '@/lib/mail';
import { licenseInfo } from '@/lib/license';
import { reviewDays } from '@/lib/review-mail';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'System', robots: { index: false, follow: false } };

export default function System() {
  const e = process.env;
  const from = e.SMTP_FROM ?? e.SMTP_USER ?? '';
  const fromAddr = (from.match(/<([^>]+)>/)?.[1] ?? from).trim().toLowerCase();
  const warn: string[] = [];
  if (!e.SMTP_HOST) warn.push('SMTP_HOST fehlt – es werden keine E-Mails versendet.');
  if (e.SMTP_HOST && !e.SMTP_PASS) warn.push('SMTP_PASS ist leer.');
  if (e.SMTP_USER && fromAddr && fromAddr !== e.SMTP_USER.toLowerCase()) warn.push(`Absender (${fromAddr}) weicht vom Postfach (${e.SMTP_USER}) ab – wird automatisch auf ${senderAddress()} korrigiert.`);
  if (e.SMTP_HOST?.includes('ionos') && ![465, 587].includes(Number(e.SMTP_PORT ?? 587))) warn.push('Für IONOS Port 587 (oder 465) verwenden.');
  const st = cronState();
  const log = mailLog().slice(0, 12);
  const lic = licenseInfo();
  const awaitingReview = listInquiries().filter((i) => i.status === 'geliefert' && i.deliveredAt && !i.reviewRequestedAt).length;
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
          <dl className="sys-dl">
            <dt>Bewertungen</dt><dd>Einladung {reviewDays()} Tage nach „Geliefert“, eine Erinnerung nach weiteren 7 Tagen · {awaitingReview} wartend</dd>
          </dl>
          <SystemTools kind="cron" />
        </section>
        <section className="box">
          <h2>Letzte E-Mails</h2>
          {!log.length ? <p className="muted">Noch keine E-Mails versendet (oder seit dem Update).</p> : <ul className="mail-log">{log.map((m, k) => <li key={k} className={m.ok ? '' : 'bad'}><span>{m.ok ? '✓' : '✗'}</span><div><b>{m.subject}</b><small>{new Date(m.date).toLocaleString('de-DE')} · an {m.to}{m.port ? ` · Port ${m.port}` : ''}</small>{m.error && <code>{m.error}</code>}</div></li>)}</ul>}
        </section>
        <section className="box" id="lizenz">
          <h2>Bildlizenz L-SHOP</h2>
          <p className={lic.warn ? 'sys-warn' : 'muted'} style={{ marginTop: 0 }}>{lic.expired ? '⚠ Abgelaufen seit ' : 'Gültig bis '}<b>{lic.until.toLocaleDateString('de-DE')}</b>{!lic.expired && ` – noch ${lic.days} Tage`}</p>
          <p style={{ fontSize: 14 }}>Die Produktbilder (B&C, Build Your Brand) und Markenlogos dürfen nur im jeweiligen Kalenderjahr genutzt werden. Für {lic.until.getFullYear() + 1}:</p>
          <ol style={{ fontSize: 14, paddingLeft: 20, margin: 0 }}>
            <li>Im L-SHOP-Downloadbereich die neuen Bildpakete {lic.until.getFullYear() + 1} laden (B&C, Build Your Brand, Brand-Logos).</li>
            <li>ZIPs in den Projektordner legen und Claude bitten: „neue Bilder {lic.until.getFullYear() + 1} einspielen“.</li>
            <li>Danach in der <code>.env</code> <code>IMAGE_LICENSE_UNTIL={lic.until.getFullYear() + 1}-12-31</code> setzen.</li>
          </ol>
          <p className="muted" style={{ fontSize: 13 }}>Nicht erlaubt: Nutzung auf Marktplätzen (Amazon, eBay) und in sozialen Netzwerken; Modelfotos verändern.</p>
        </section>
      </div>
    </>
  );
}
