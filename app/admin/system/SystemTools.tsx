'use client';
import { useState } from 'react';

const HINTS: [RegExp, string][] = [
  [/535|EAUTH|auth/i, 'Anmeldung abgelehnt: Postfach (SMTP_USER) oder Passwort (SMTP_PASS) stimmt nicht. Bei Sonderzeichen im Passwort in der .env einfache Anführungszeichen nutzen: SMTP_PASS=\'Pass#word!\''],
  [/550|553|554|sender|from/i, 'Absender abgelehnt: SMTP_FROM muss zum Postfach passen, z. B. SMTP_FROM="Euro-Trade <info@euro-trade.com>"'],
  [/ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENOTFOUND|timeout/i, 'Keine Verbindung zum Mailserver: SMTP_HOST=smtp.ionos.de und SMTP_PORT=587 prüfen.'],
  [/certificate|self signed|TLS|SSL/i, 'Verschlüsselungsproblem: Port 587 (STARTTLS) oder 465 (SSL) probieren.'],
];

export default function SystemTools({ kind, defaultTo = '' }: { kind: 'mail' | 'cron'; defaultTo?: string }) {
  const [to, setTo] = useState(defaultTo);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; t: string; hint?: string; raw?: string } | null>(null);

  async function testMail() {
    setBusy(true); setRes(null);
    const r = await fetch('/api/admin/system', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.ok) setRes({ ok: true, t: `✓ Testmail an ${d.to} gesendet – bitte Postfach (und Spam) prüfen.` });
    else {
      const raw = [d.error, d.code, d.response].filter(Boolean).join(' · ');
      setRes({ ok: false, t: `✗ ${d.step === 'login' ? 'Anmeldung am Mailserver fehlgeschlagen' : d.step === 'send' ? 'Versand abgelehnt' : 'Konfiguration unvollständig'}`, hint: HINTS.find(([re]) => re.test(raw))?.[1], raw });
    }
  }
  async function runCron() {
    setBusy(true); setRes(null);
    const r = await fetch('/api/cron');
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setRes(r.ok ? { ok: true, t: `✓ ${d.result}` } : { ok: false, t: d.error ?? 'Fehler' });
    if (r.ok) setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div className="sys-tools">
      {kind === 'mail' ? <div className="ds-inline"><input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Empfänger" /><button className="btn" disabled={busy} onClick={testMail}>{busy ? 'Teste …' : 'Testmail senden'}</button></div>
        : <button className="btn alt" disabled={busy} onClick={runCron}>{busy ? 'Prüfe …' : 'Jetzt prüfen & senden'}</button>}
      {res && <div className={`sys-res ${res.ok ? 'ok' : 'bad'}`}><b>{res.t}</b>{res.hint && <p>{res.hint}</p>}{res.raw && <code>{res.raw}</code>}</div>}
    </div>
  );
}
