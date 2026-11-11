'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Inquiry } from '@/lib/store';

const CAR: [string, string][] = [['dhl', 'DHL'], ['dpd', 'DPD'], ['gls', 'GLS'], ['ups', 'UPS'], ['hermes', 'Hermes'], ['abholung', 'Abholung']];

/** Admin: Lieferschein, Versand (DHL-Label oder Sendungsnummer), Zustellung */
export default function ShippingBox({ no, shipment, trackingUrl, dhl, addr }: { no: string; shipment: Inquiry['shipment']; trackingUrl: string; dhl: boolean; addr: { name1: string; name2: string; street: string; zip: string; city: string } }) {
  const router = useRouter();
  const [carrier, setCarrier] = useState(shipment?.carrier ?? 'dhl');
  const [tracking, setTracking] = useState(shipment?.tracking ?? '');
  const [label, setLabel] = useState(false);
  const [weight, setWeight] = useState('2');
  const [a, setA] = useState(addr);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function post(body: Record<string, unknown>) {
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/admin/anfrage/${no}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy(false); setMsg({ ok: r.ok, t: d.message ?? d.error });
    if (r.ok) { if (d.labelId) window.open(`/api/upload/${d.labelId}`, '_blank'); router.refresh(); }
  }
  return (
    <div className="box">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <strong>Versand</strong>
        <a className="alink" href={`/api/admin/anfrage/${no}`} target="_blank" style={{ fontSize: 14 }}>Lieferschein (PDF) drucken</a>
      </div>
      {shipment && <div className="ship-now">
        <span>{shipment.carrier === 'abholung' ? 'Abholbereit seit' : `${CAR.find((c) => c[0] === shipment.carrier)?.[1]} · versendet am`} {new Date(shipment.shippedAt).toLocaleDateString('de-DE')}</span>
        {shipment.tracking && (trackingUrl ? <a className="alink" href={trackingUrl} target="_blank">{shipment.tracking}</a> : <b>{shipment.tracking}</b>)}
        {shipment.status && <span className="muted">· {shipment.status}</span>}
        {shipment.labelId && <a className="alink" href={`/api/upload/${shipment.labelId}`} target="_blank">Label</a>}
        {shipment.deliveredAt ? <span className="ok">✓ zugestellt {new Date(shipment.deliveredAt).toLocaleDateString('de-DE')}</span> : <button className="btn alt sm" disabled={busy} onClick={() => post({ action: 'delivered' })}>Als zugestellt markieren</button>}
      </div>}
      <div className="deco-row" style={{ marginTop: 10 }}>{CAR.map(([k, l]) => <button key={k} type="button" className={`size ${carrier === k ? 'on' : ''}`} onClick={() => { setCarrier(k); if (k !== 'dhl') setLabel(false); }}>{l}</button>)}</div>
      {carrier === 'dhl' && dhl && <label className="ds-check" style={{ marginTop: 10 }}><input type="checkbox" checked={label} onChange={(e) => setLabel(e.target.checked)} /> DHL-Label automatisch erstellen</label>}
      {label ? <div className="form" style={{ marginTop: 6 }}>
        <div className="two"><div><label>Name / Firma</label><input value={a.name1} onChange={(e) => setA({ ...a, name1: e.target.value })} /></div><div><label>z. Hd.</label><input value={a.name2} onChange={(e) => setA({ ...a, name2: e.target.value })} /></div></div>
        <div className="two"><div><label>Straße und Nr.</label><input value={a.street} onChange={(e) => setA({ ...a, street: e.target.value })} /></div><div><label>Gewicht (kg)</label><input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></div></div>
        <div className="two"><div><label>PLZ</label><input value={a.zip} onChange={(e) => setA({ ...a, zip: e.target.value })} /></div><div><label>Ort</label><input value={a.city} onChange={(e) => setA({ ...a, city: e.target.value })} /></div></div>
      </div> : carrier !== 'abholung' && <div className="ds-inline" style={{ marginTop: 10 }}><input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Sendungsnummer" /></div>}
      <div className="deco-row" style={{ marginTop: 10 }}>
        <button className="btn" disabled={busy || (!label && carrier !== 'abholung' && !tracking.trim())} onClick={() => post({ action: 'ship', carrier, tracking, dhlLabel: label, weight: Number(weight.replace(',', '.')), addr: a })}>{busy ? 'Speichert …' : label ? 'Label erstellen & Kunde informieren' : carrier === 'abholung' ? 'Abholbereit melden' : 'Versendet – Kunde informieren'}</button>
        {msg && <span className={msg.ok ? 'ok' : 'err'} style={{ fontSize: 14 }}>{msg.t}</span>}
      </div>
      {!dhl && carrier === 'dhl' && <p className="muted" style={{ fontSize: 12.5, margin: '8px 0 0' }}>DHL-Labels direkt aus dem Shop: Geschäftskundenzugang in der .env eintragen (DHL_API_KEY, DHL_USER, DHL_PASS, DHL_BILLING).</p>}
      <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>Zustellung wird bei DHL automatisch erkannt, sonst nach einigen Werktagen angenommen → Status „Geliefert“ → Bewertungseinladung.</p>
    </div>
  );
}
