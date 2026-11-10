'use client';
import { useState } from 'react';
import { eur } from '@/lib/format';
import type { Offer, OfferLine, Status } from '@/lib/store';

function Money({ value, onChange, width = 110 }: { value: number; onChange: (n: number) => void; width?: number | string }) {
  const fmt = (n: number) => String(n).replace('.', ',');
  const [txt, setTxt] = useState(fmt(value));
  const [focus, setFocus] = useState(false);
  return <input inputMode="decimal" style={{ width }} value={focus ? txt : fmt(value)}
    onFocus={() => { setTxt(fmt(value)); setFocus(true); }}
    onChange={(e) => { setTxt(e.target.value); onChange(Math.round((Number(e.target.value.replace(',', '.')) || 0) * 100) / 100); }}
    onBlur={() => setFocus(false)} />;
}

type Props = { no: string; initial: Offer; saved: boolean; status: Status; statuses: Record<Status, string>; mail: boolean; acceptUrl: string; sentAt: string | null };

export default function OfferEditor({ no, initial, saved, status: st0, statuses, mail, acceptUrl, sentAt }: Props) {
  const [o, setO] = useState<Offer>(initial);
  const [status, setStatus] = useState<Status>(st0);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [isSaved, setSaved] = useState(saved);
  const [copied, setCopied] = useState(false);

  const setLine = (k: number, patch: Partial<OfferLine>) => setO((x) => ({ ...x, lines: x.lines.map((l, n) => (n === k ? { ...l, ...patch } : l)) }));
  const num = (v: string) => Number(String(v).replace(',', '.')) || 0;
  const net = o.lines.reduce((s, l) => s + l.qty * l.price, 0) + (o.shipping || 0);
  const vat = Math.round(net * o.vat) / 100;

  async function call(action: 'save' | 'send' | 'status', extra: Record<string, unknown> = {}) {
    setBusy(action); setMsg(null);
    const r = await fetch(`/api/admin/anfrage/${no}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, offer: o, status, ...extra }) });
    const d = await r.json().catch(() => ({}));
    setBusy('');
    if (!r.ok) { setMsg({ ok: false, t: d.error ?? 'Fehler' }); return false; }
    if (d.status) setStatus(d.status);
    if (action !== 'status') setSaved(true);
    setMsg({ ok: true, t: d.message ?? 'Gespeichert.' });
    return true;
  }

  return (
    <>
      <div className="box" style={{ overflowX: 'auto' }}>
        <table className="atable offer">
          <thead><tr><th style={{ width: '46%' }}>Position</th><th>Menge</th><th>Einzelpreis netto</th><th>Gesamt</th><th /></tr></thead>
          <tbody>
            {o.lines.map((l, k) => (
              <tr key={`${k}-${o.lines.length}`}>
                <td>
                  <input value={l.text} onChange={(e) => setLine(k, { text: e.target.value })} />
                  <input className="small" value={l.detail ?? ''} placeholder="Details (Farbe, Größe, Position …)" onChange={(e) => setLine(k, { detail: e.target.value })} />
                </td>
                <td><input type="number" min={0} value={l.qty} onChange={(e) => setLine(k, { qty: Math.max(0, Math.floor(num(e.target.value))) })} style={{ width: 80 }} /></td>
                <td><Money value={l.price} onChange={(n) => setLine(k, { price: n })} /></td>
                <td style={{ whiteSpace: 'nowrap' }}><strong>{eur(l.qty * l.price)}</strong></td>
                <td><button type="button" className="x" onClick={() => setO((x) => ({ ...x, lines: x.lines.filter((_, n) => n !== k) }))} aria-label="Position entfernen">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="deco-row" style={{ marginTop: 10 }}>
          <button type="button" className="btn alt" onClick={() => setO((x) => ({ ...x, lines: [...x.lines, { text: 'Veredelung: ', detail: '', qty: 1, price: 0 }] }))}>+ Position</button>
          <button type="button" className="btn alt" onClick={() => setO((x) => ({ ...x, lines: [...x.lines, { text: 'Einrichtungskosten / Stickprogramm', detail: 'einmalig', qty: 1, price: 0 }] }))}>+ Einrichtungskosten</button>
        </div>
        <div className="offer-foot">
          <div className="form" style={{ flex: 1, minWidth: 260 }}>
            <label>Hinweis im Angebot</label>
            <textarea value={o.note} onChange={(e) => setO({ ...o, note: e.target.value })} placeholder="z. B. Lieferung bis KW 50 möglich, Druckfreigabe per Mail …" />
            <div className="two">
              <div><label>Versand netto</label><Money value={o.shipping} width="100%" onChange={(n) => setO((x) => ({ ...x, shipping: n }))} /></div>
              <div><label>Gültig (Tage)</label><input type="number" min={1} value={o.validDays} onChange={(e) => setO({ ...o, validDays: Math.max(1, Math.floor(num(e.target.value))) })} /></div>
            </div>
          </div>
          <div className="offer-sum">
            {o.shipping > 0 && <div className="tot"><span>Versand</span><span>{eur(o.shipping)}</span></div>}
            <div className="tot"><span>Summe netto</span><span>{eur(net)}</span></div>
            <div className="tot"><span>MwSt. {o.vat} %</span><span>{eur(vat)}</span></div>
            <div className="tot big"><span>Gesamt</span><span>{eur(net + vat)}</span></div>
          </div>
        </div>
      </div>

      <div className="admin-actions">
        <button className="btn alt" disabled={!!busy} onClick={() => call('save')}>{busy === 'save' ? 'Speichert …' : 'Angebot speichern'}</button>
        <a className={`btn alt ${!isSaved ? 'disabled' : ''}`} href={isSaved ? `/api/admin/anfrage/${no}/pdf` : undefined} target="_blank" rel="noreferrer" style={{ display: 'inline-grid', placeItems: 'center' }} onClick={(e) => { if (!isSaved) e.preventDefault(); }}>PDF ansehen</a>
        <button className="btn" disabled={!!busy || !o.lines.length} onClick={() => { if (confirm(mail ? 'Angebot jetzt per E-Mail an den Kunden senden?' : 'SMTP ist nicht eingerichtet. Angebot trotzdem als „gesendet“ markieren? Sie können den Link unten selbst verschicken.')) call('send'); }}>
          {busy === 'send' ? 'Sendet …' : sentAt ? 'Angebot erneut senden' : 'Angebot an Kunden senden'}
        </button>
        <span style={{ flex: 1 }} />
        <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>Status
          <select value={status} onChange={(e) => { const s = e.target.value as Status; setStatus(s); call('status', { status: s }); }}>
            {(Object.keys(statuses) as Status[]).map((s) => <option key={s} value={s}>{statuses[s]}</option>)}
          </select>
        </label>
      </div>
      {msg && <div className={`note ${msg.ok ? 'ok' : 'err'}`}>{msg.ok ? '✓ ' : ''}{msg.t}</div>}
      {acceptUrl && isSaved && (
        <p className="muted" style={{ fontSize: 13 }}>
          Annahme-Link für den Kunden: <a className="alink" href={acceptUrl} target="_blank" rel="noreferrer">{acceptUrl}</a>{' '}
          <button type="button" className="linkbtn" onClick={() => { navigator.clipboard.writeText(acceptUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? '✓ kopiert' : 'kopieren'}</button>
        </p>
      )}
    </>
  );
}
