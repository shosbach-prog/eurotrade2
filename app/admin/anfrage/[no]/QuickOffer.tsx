'use client';
import { useState } from 'react';
import { eur } from '@/lib/format';
import type { Offer } from '@/lib/store';

/** Schnellangebot: fertigen Entwurf prüfen und mit einem Klick senden */
export default function QuickOffer({ no, offer, gross, net, margin, warnings, mail, email }: { no: string; offer: Offer; gross: number; net: number; margin: { margin: number; pct: number; missingEk: number } | null; warnings: string[]; mail: boolean; email: string }) {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function send() {
    if (warnings.length && !ok) return;
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/admin/anfrage/${no}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', offer }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? { ok: true, t: d.message ?? 'Angebot gesendet.' } : { ok: false, t: d.error ?? 'Fehler beim Senden' });
    if (r.ok) setTimeout(() => location.reload(), 1200);
  }
  return (
    <div className="box quick" id="schnell">
      <div className="quick-head">
        <div><b>Schnellangebot</b><span className="muted"> · fertig kalkuliert aus Shoppreisen, Veredelung und Versand</span></div>
        <div className="quick-sum"><span>{offer.lines.length} {offer.lines.length === 1 ? "Position" : "Positionen"} · netto {eur(net)}</span><b>{eur(gross)} brutto</b>{margin && <small className={margin.pct < 20 ? 'err' : 'ok'}>Marge ca. {eur(margin.margin)} ({margin.pct} %){margin.missingEk ? ` · EK fehlt für ${margin.missingEk} Stk.` : ''}</small>}</div>
      </div>
      {warnings.length > 0 && <ul className="quick-warn">{warnings.map((w) => <li key={w}>⚠ {w}</li>)}</ul>}
      <div className="deco-row" style={{ alignItems: 'center' }}>
        {warnings.length > 0 && <label className="ds-check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> geprüft, trotzdem senden</label>}
        <button className="btn" disabled={busy || !mail || (warnings.length > 0 && !ok)} onClick={send}>{busy ? 'Wird gesendet …' : `Angebot an ${email} senden`}</button>
        <a className="linkbtn" href="#angebot">oder unten bearbeiten</a>
      </div>
      {!mail && <p className="err" style={{ fontSize: 13 }}>Mailversand ist nicht eingerichtet – Angebot unten speichern und Link selbst schicken.</p>}
      {msg && <div className={`note ${msg.ok ? 'ok' : 'err'}`}>{msg.t}</div>}
    </div>
  );
}
