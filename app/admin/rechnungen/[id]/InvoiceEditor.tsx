'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Invoice, InvLine } from '@/lib/invoice';

const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const num = (s: string) => { const n = Number(String(s).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Zahlenfeld, in dem man Kommas tippen kann */
function Num({ v, set, disabled, style }: { v: number; set: (n: number) => void; disabled?: boolean; style?: React.CSSProperties }) {
  const fmtN = (n: number) => String(n).replace('.', ',');
  const [t, setT] = useState(fmtN(v));
  useEffect(() => { if (num(t) !== v) setT(fmtN(v)); }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  return <input inputMode="decimal" disabled={disabled} style={style} value={t} onChange={(e) => { const x = e.target.value.replace(/[^0-9,.-]/g, ''); setT(x); set(num(x)); }} onBlur={() => setT(fmtN(v))} />;
}

export default function InvoiceEditor({ initial, problems, overdue, due, mail, publicUrl }: { initial: Invoice; problems: string[]; overdue: boolean; due: string; total: number; mail: boolean; publicUrl: string }) {
  const router = useRouter();
  const [inv, setInv] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const final = !!inv.no;
  const b = inv.buyer;
  const t = useMemo(() => { const net = r2(inv.lines.reduce((s, l) => s + r2(l.qty * l.price), 0) + (inv.shipping || 0)); const rate = inv.kleinunternehmer ? 0 : inv.vat; const vat = r2((net * rate) / 100); return { net, rate, vat, gross: r2(net + vat) }; }, [inv]);
  const setB = (k: keyof Invoice['buyer'], v: string) => setInv({ ...inv, buyer: { ...b, [k]: v } });
  const setL = (k: number, p: Partial<InvLine>) => setInv({ ...inv, lines: inv.lines.map((l, n) => (n === k ? { ...l, ...p } : l)) });

  async function act(action: string, extra: Record<string, unknown> = {}) {
    if (action === 'finalize-send' && !confirm(`Rechnung festschreiben und an ${b.email} senden?\n\nDanach ist sie nicht mehr änderbar (nur Storno möglich).`)) return;
    if (action === 'finalize' && !confirm('Rechnung festschreiben (ohne E-Mail)? Danach nicht mehr änderbar.')) return;
    if (action === 'storno' && !confirm(`Rechnung ${inv.no} stornieren? Es wird eine Rechnungskorrektur mit eigener Nummer erstellt und an den Kunden gesendet.`)) return;
    if (action === 'delete' && !confirm('Entwurf löschen?')) return;
    setBusy(true); setMsg(null);
    const r = await fetch('/api/admin/rechnungen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, id: inv.id, invoice: inv, ...extra }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg({ ok: r.ok, t: d.message ?? d.error ?? (r.ok ? 'OK' : 'Fehler') });
    if (!r.ok) return;
    if (action === 'delete') return router.push('/admin/rechnungen');
    if (action === 'storno' && d.id) return router.push(`/admin/rechnungen/${d.id}`);
    if (d.invoice) setInv(d.invoice);
    router.refresh();
  }

  return (
    <div className="inv-ed">
      <div className="inv-head">
        <div>
          <h1 style={{ margin: 0 }}>{inv.kind === 'storno' ? 'Rechnungskorrektur' : 'Rechnung'} {inv.no ?? <span className="muted">(Entwurf)</span>}</h1>
          <div className="muted" style={{ fontSize: 14 }}>{final ? <>Festgeschrieben {new Date(inv.finalizedAt!).toLocaleString('de-DE')}{inv.refNo && <> · zu {inv.refNo}</>}{inv.stornoNo && <> · storniert durch {inv.stornoNo}</>}</> : 'Noch änderbar – Nummer wird beim Festschreiben vergeben.'}</div>
        </div>
        <div className="inv-total">{eur(t.gross)}<small>{final && inv.kind === 'rechnung' ? (inv.status === 'bezahlt' ? `bezahlt am ${new Date(inv.paidAt!).toLocaleDateString('de-DE')}` : inv.status === 'storniert' ? 'storniert' : `${overdue ? 'überfällig seit' : 'fällig am'} ${new Date(due).toLocaleDateString('de-DE')}`) : `netto ${eur(t.net)}`}</small></div>
      </div>

      {!final && problems.length > 0 && <p className="sys-warn">Vor dem Festschreiben ergänzen: {problems.join(' · ')}</p>}

      <div className="inv-grid">
        <div className="box form">
          <strong>Rechnungsempfänger</strong>
          <div className="two"><div><label>Firma / Verein</label><input disabled={final} value={b.company} onChange={(e) => setB('company', e.target.value)} /></div><div><label>Ansprechpartner</label><input disabled={final} value={b.name} onChange={(e) => setB('name', e.target.value)} /></div></div>
          <label>Straße und Nr. *</label><input disabled={final} value={b.street} onChange={(e) => setB('street', e.target.value)} />
          <div className="two"><div><label>PLZ *</label><input disabled={final} value={b.zip} onChange={(e) => setB('zip', e.target.value)} /></div><div><label>Ort *</label><input disabled={final} value={b.city} onChange={(e) => setB('city', e.target.value)} /></div></div>
          <div className="two"><div><label>E-Mail *</label><input disabled={final} value={b.email} onChange={(e) => setB('email', e.target.value)} /></div><div><label>USt-IdNr. des Kunden</label><input disabled={final} value={b.vatId ?? ''} onChange={(e) => setB('vatId', e.target.value)} placeholder="optional" /></div></div>
          <label>Ihre Referenz / Bestellnummer / Leitweg-ID</label><input disabled={final} value={b.reference ?? ''} onChange={(e) => setB('reference', e.target.value)} placeholder="bei Behörden: Leitweg-ID" />
        </div>
        <div className="box form">
          <strong>Daten</strong>
          <div className="two"><div><label>Rechnungsdatum</label><input type="date" disabled={final} value={inv.date} onChange={(e) => setInv({ ...inv, date: e.target.value })} /></div><div><label>Leistungs-/Lieferdatum</label><input type="date" disabled={final} value={inv.serviceDate} onChange={(e) => setInv({ ...inv, serviceDate: e.target.value })} /></div></div>
          <div className="two"><div><label>Zahlungsziel (Tage)</label><input inputMode="numeric" disabled={final} value={inv.payDays} onChange={(e) => setInv({ ...inv, payDays: Math.max(0, Math.floor(num(e.target.value))) })} /></div><div><label>USt-Satz %</label><Num disabled={final || inv.kleinunternehmer} v={inv.kleinunternehmer ? 0 : inv.vat} set={(n) => setInv({ ...inv, vat: n })} /></div></div>
          <label>Hinweis auf der Rechnung</label><textarea rows={3} disabled={final} value={inv.note} onChange={(e) => setInv({ ...inv, note: e.target.value })} placeholder="z. B. Lieferung erfolgte am … an …" />
        </div>
      </div>

      <div className="box" style={{ marginTop: 16, overflowX: 'auto' }}>
        <table className="atable inv-lines">
          <thead><tr><th style={{ width: '46%' }}>Leistung</th><th>Menge</th><th>Einheit</th><th>Einzelpreis netto</th><th>Gesamt</th><th /></tr></thead>
          <tbody>
            {inv.lines.map((l, k) => <tr key={k}>
              <td><input disabled={final} value={l.text} onChange={(e) => setL(k, { text: e.target.value })} placeholder="Bezeichnung" /><input disabled={final} className="sub" value={l.detail ?? ''} onChange={(e) => setL(k, { detail: e.target.value })} placeholder="Details (Farbe, Größe …)" /></td>
              <td><Num disabled={final} v={l.qty} set={(n) => setL(k, { qty: n })} /></td>
              <td><input disabled={final} value={l.unit} onChange={(e) => setL(k, { unit: e.target.value })} /></td>
              <td><Num disabled={final} v={l.price} set={(n) => setL(k, { price: n })} /></td>
              <td><b>{eur(l.qty * l.price)}</b></td>
              <td>{!final && <button className="x" onClick={() => setInv({ ...inv, lines: inv.lines.filter((_, n) => n !== k) })}>×</button>}</td>
            </tr>)}
          </tbody>
        </table>
        {!final && <button className="btn alt sm" style={{ marginTop: 8 }} onClick={() => setInv({ ...inv, lines: [...inv.lines, { text: '', qty: 1, unit: 'Stk', price: 0 }] })}>+ Position</button>}
        <div className="offer-sum" style={{ marginLeft: 'auto', marginTop: 12 }}>
          <div className="tot"><span>Versand netto</span><span><Num disabled={final} v={inv.shipping} set={(n) => setInv({ ...inv, shipping: n })} style={{ width: 90, textAlign: 'right' }} /></span></div>
          <div className="tot"><span>Summe netto</span><span>{eur(t.net)}</span></div>
          <div className="tot"><span>{inv.kleinunternehmer ? 'USt. (§ 19 UStG)' : `USt. ${t.rate} %`}</span><span>{eur(t.vat)}</span></div>
          <div className="tot big"><span>Rechnungsbetrag</span><span>{eur(t.gross)}</span></div>
        </div>
      </div>

      <div className="box inv-actions">
        {!final ? <>
          <button className="btn alt" disabled={busy} onClick={() => act('save')}>Entwurf speichern</button>
          <a className="btn alt" href={`/api/admin/rechnungen/datei?id=${inv.id}`} target="_blank" onClick={async (e) => { e.preventDefault(); await act('save'); window.open(`/api/admin/rechnungen/datei?id=${inv.id}`, '_blank'); }}>PDF-Vorschau</a>
          <span style={{ flex: 1 }} />
          <button className="linkbtn err" disabled={busy} onClick={() => act('delete')}>Entwurf löschen</button>
          <button className="btn alt" disabled={busy} onClick={() => act('finalize')}>Festschreiben</button>
          <button className="btn" disabled={busy || !mail} title={mail ? '' : 'E-Mail-Versand nicht eingerichtet'} onClick={() => act('finalize-send')}>Festschreiben & per E-Mail senden</button>
        </> : <>
          <a className="btn alt" href={`/api/admin/rechnungen/datei?id=${inv.id}`} target="_blank">PDF</a>
          <a className="btn alt" href={`/api/admin/rechnungen/datei?id=${inv.id}&typ=xml`}>XRechnung (XML)</a>
          <button className="linkbtn" onClick={() => { navigator.clipboard?.writeText(publicUrl); setMsg({ ok: true, t: 'Kunden-Link kopiert.' }); }}>Kunden-Link kopieren</button>
          <span style={{ flex: 1 }} />
          {mail && <button className="btn alt" disabled={busy} onClick={() => act('send')}>{inv.sentAt ? 'Erneut senden' : 'Per E-Mail senden'}</button>}
          {inv.kind === 'rechnung' && inv.status === 'offen' && <>
            {mail && <button className="btn alt" disabled={busy} onClick={() => act('remind')}>Zahlungserinnerung</button>}
            <span className="inv-paid"><input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} /><button className="btn" disabled={busy} onClick={() => act('paid', { date: paidDate })}>✓ Bezahlt</button></span>
          </>}
          {inv.status === 'bezahlt' && inv.kind === 'rechnung' && <button className="linkbtn" onClick={() => act('paid', { undo: true })}>Zahlung zurücksetzen</button>}
          {inv.kind === 'rechnung' && inv.status !== 'storniert' && <button className="linkbtn err" disabled={busy} onClick={() => act('storno', { send: mail })}>Stornieren</button>}
        </>}
      </div>
      {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.t}</p>}
      {inv.history?.length ? <div className="box" style={{ marginTop: 16 }}><strong>Verlauf</strong><ul className="hist">{inv.history.slice().reverse().map((h, k) => <li key={k}><span className="muted">{new Date(h.date).toLocaleString('de-DE')}</span> {h.text}</li>)}</ul></div> : null}
    </div>
  );
}
