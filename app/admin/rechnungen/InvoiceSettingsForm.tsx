'use client';
import { useState } from 'react';
import type { InvoiceSettings } from '@/lib/invoice';

const F: [keyof InvoiceSettings, string, string?][] = [
  ['company', 'Firmenname'], ['owner', 'Inhaber'], ['street', 'Straße und Nr.'], ['zip', 'PLZ'], ['city', 'Ort'],
  ['phone', 'Telefon'], ['email', 'E-Mail'], ['web', 'Webseite'],
  ['taxNo', 'Steuernummer', 'z. B. 314/5023/1234'], ['vatId', 'USt-IdNr.', 'z. B. DE123456789'],
  ['iban', 'IBAN'], ['bic', 'BIC'], ['bank', 'Bank'],
];

export default function InvoiceSettingsForm({ initial, open: o }: { initial: InvoiceSettings; open: boolean }) {
  const [s, setS] = useState(initial);
  const [open, setOpen] = useState(o);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function save() {
    const r = await fetch('/api/admin/rechnungen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'settings', settings: s }) });
    const d = await r.json().catch(() => ({})); setMsg({ ok: r.ok, t: d.message ?? d.error });
    if (r.ok) setTimeout(() => location.reload(), 700);
  }
  return (
    <div className="box" style={{ marginTop: 20 }}>
      <button type="button" className="imp-head" onClick={() => setOpen(!open)}><b>Rechnungsdaten & Einstellungen</b><span className="muted" style={{ marginLeft: 'auto' }}>{open ? '▲' : '▼'}</span></button>
      {open && <div className="form" style={{ marginTop: 12 }}>
        <div className="inv-set">{F.map(([k, l, ph]) => <div key={k}><label>{l}</label><input value={String(s[k] ?? '')} placeholder={ph} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></div>)}</div>
        <div className="inv-set">
          <div><label>Zahlungsziel (Tage)</label><input inputMode="numeric" value={s.payDays} onChange={(e) => setS({ ...s, payDays: Number(e.target.value) || 0 })} /></div>
          <div><label>Nummernkreis-Präfix</label><input value={s.prefix} onChange={(e) => setS({ ...s, prefix: e.target.value })} /><small className="muted">ergibt {s.prefix}{new Date().getFullYear()}-0001</small></div>
          <div><label>Zahlungserinnerung nach Fälligkeit (Tage, 0 = aus)</label><input inputMode="numeric" value={s.reminderDays} onChange={(e) => setS({ ...s, reminderDays: Number(e.target.value) || 0 })} /></div>
          <div><label>Zusatz in der Fußzeile</label><input value={s.footer} placeholder="z. B. Amtsgericht / Handelsregister" onChange={(e) => setS({ ...s, footer: e.target.value })} /></div>
        </div>
        <label className="ds-check" style={{ marginTop: 10 }}><input type="checkbox" checked={s.kleinunternehmer} onChange={(e) => setS({ ...s, kleinunternehmer: e.target.checked })} /> Kleinunternehmer nach § 19 UStG (keine Umsatzsteuer ausweisen)</label>
        <h3 style={{ margin: '18px 0 4px', fontSize: 15 }}>Buchhaltung</h3>
        <p className="muted" style={{ fontSize: 13, margin: '0 0 8px' }}>Jede festgeschriebene Rechnung (PDF + XRechnung) automatisch weitergeben – z. B. an die Beleg-E-Mail-Adresse von Lexware Office, sevDesk oder DATEV Upload Mail, oder direkt per API an Lexware Office.</p>
        <div className="inv-set">
          <div><label>Beleg-E-Mail der Buchhaltung</label><input value={s.bookkeepingEmail} placeholder="z. B. belege-xyz@lexoffice.de" onChange={(e) => setS({ ...s, bookkeepingEmail: e.target.value })} /></div>
          <div><label>Lexware Office API-Schlüssel</label><input value={s.lexofficeKey} placeholder="aus app.lexoffice.de/addons/public-api" onChange={(e) => setS({ ...s, lexofficeKey: e.target.value })} /></div>
        </div>
        <label className="ds-check"><input type="checkbox" checked={s.autoForward} onChange={(e) => setS({ ...s, autoForward: e.target.checked })} /> Rechnungen automatisch an die Beleg-E-Mail senden</label>
        <label className="ds-check"><input type="checkbox" checked={s.lexofficeAuto} onChange={(e) => setS({ ...s, lexofficeAuto: e.target.checked })} /> Rechnungen automatisch an Lexware Office übertragen</label>
        <div className="deco-row" style={{ marginTop: 12 }}><button className="btn" onClick={save}>Speichern</button>{msg && <span className={msg.ok ? 'ok' : 'err'}>{msg.t}</span>}</div>
        <p className="muted" style={{ fontSize: 13 }}>Diese Daten erscheinen auf jeder Rechnung (Pflichtangaben nach § 14 UStG). Bereits festgeschriebene Rechnungen behalten die Daten zum Zeitpunkt der Erstellung.</p>
      </div>}
    </div>
  );
}
