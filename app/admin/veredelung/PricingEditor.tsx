'use client';
import { useEffect, useMemo, useState } from 'react';
import { calcDeco, type DecoPricing, type MethodPrices } from '@/lib/deco-pricing';

type K = 'stick' | 'druck';
const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const num = (s: string) => { const n = Number(s.replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : 0; };

/** Zahlenfeld, das Kommas beim Tippen zulässt (Text lokal, Zahl nach außen) */
function N({ v, set, dec = true, disabled, style }: { v: number; set: (n: number) => void; dec?: boolean; disabled?: boolean; style?: React.CSSProperties }) {
  const fmt = (n: number) => String(n).replace('.', ',');
  const [txt, setTxt] = useState(fmt(v));
  useEffect(() => { if (num(txt) !== v) setTxt(fmt(v)); }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  return <input inputMode={dec ? 'decimal' : 'numeric'} value={txt} disabled={disabled} style={style}
    onChange={(e) => { const t = e.target.value.replace(/[^0-9,.]/g, ''); setTxt(t); set(dec ? num(t) : Math.floor(num(t))); }}
    onBlur={() => setTxt(fmt(v))} />;
}

export default function PricingEditor({ initial, defaults }: { initial: DecoPricing; defaults: DecoPricing }) {
  const [p, setP] = useState<DecoPricing>(initial);
  const [tab, setTab] = useState<K>('stick');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [t, setT] = useState({ method: 'Stick', cm: '9', qty: '20', pos2: '' });
  const m = p[tab];
  const setM = (fn: (m: MethodPrices) => MethodPrices) => { setP((x) => ({ ...x, [tab]: fn(structuredClone(x[tab])) })); setDirty(true); setMsg(null); };

  const test = useMemo(() => calcDeco(p, t.method, [{ pos: 'Position 1', cm: num(t.cm) }, ...(num(t.pos2) > 0 ? [{ pos: 'Position 2', cm: num(t.pos2) }] : [])], num(t.qty)), [p, t]);

  async function save() {
    setBusy(true);
    const r = await fetch('/api/admin/veredelung', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setP(d.pricing); setDirty(false); setMsg({ ok: true, t: 'Gespeichert – gilt ab sofort für neue Angebote und die Preisanzeige im Shop.' }); }
    else setMsg({ ok: false, t: d.error ?? 'Speichern fehlgeschlagen' });
  }

  return (
    <div className="pe">
      <div className="pe-top">
        <div className="seg">
          <button type="button" className={tab === 'stick' ? 'on' : ''} onClick={() => setTab('stick')}>🧵 Stick</button>
          <button type="button" className={tab === 'druck' ? 'on' : ''} onClick={() => setTab('druck')}>🖨 Druck</button>
        </div>
        <span style={{ flex: 1 }} />
        {msg && <span className={msg.ok ? 'ok' : 'err'} style={{ fontSize: 14 }}>{msg.t}</span>}
        <button className="btn" disabled={!dirty || busy} onClick={save}>{busy ? 'Speichert …' : dirty ? 'Speichern' : 'Gespeichert'}</button>
      </div>

      <div className="box pe-box">
        <h2>{tab === 'stick' ? 'Stick' : 'Druck (Transfer / Digitaldruck)'} – Preis je Stück und Position</h2>
        <div className="pe-scroll">
          <table className="pe-table">
            <thead>
              <tr>
                <th>Motivbreite</th>
                {m.tiers.map((q, j) => (
                  <th key={tab + j + '-' + m.tiers.length}>
                    <div className="pe-tier">ab <N v={q} dec={false} disabled={j === 0} set={(n) => setM((x) => { x.tiers[j] = Math.max(1, n); return x; })} /> Stk.
                      {j > 0 && <button type="button" className="x" title="Stufe entfernen" onClick={() => setM((x) => { x.tiers.splice(j, 1); x.prices.forEach((r) => r.splice(j, 1)); return x; })}>×</button>}
                    </div>
                  </th>
                ))}
                <th className="pe-setup">{m.setupLabel}<br /><small>einmalig je Position</small></th>
                <th />
              </tr>
            </thead>
            <tbody>
              {m.sizes.map((s, i) => (
                <tr key={tab + i + '-' + m.sizes.length}>
                  <td className="pe-size">
                    <span>bis</span><N v={s.maxCm} set={(n) => setM((x) => { x.sizes[i].maxCm = n; x.sizes[i].label = `bis ${String(n).replace('.', ',')} cm`; return x; })} /><span>cm</span>
                  </td>
                  {m.tiers.map((_, j) => (
                    <td key={j}><div className="pe-cell"><N v={m.prices[i]?.[j] ?? 0} set={(n) => setM((x) => { x.prices[i][j] = n; return x; })} /><span>€</span></div></td>
                  ))}
                  <td className="pe-setup"><div className="pe-cell"><N v={m.setup[i] ?? 0} set={(n) => setM((x) => { x.setup[i] = n; return x; })} /><span>€</span></div></td>
                  <td><button type="button" className="x" title="Größe entfernen" onClick={() => setM((x) => { x.sizes.splice(i, 1); x.prices.splice(i, 1); x.setup.splice(i, 1); return x; })}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pe-actions">
          <button type="button" className="btn alt sm" onClick={() => setM((x) => { const last = x.sizes[x.sizes.length - 1]?.maxCm ?? 10; x.sizes.push({ label: `bis ${last + 10} cm`, maxCm: last + 10 }); x.prices.push(x.tiers.map((_, j) => x.prices[x.prices.length - 1]?.[j] ?? 0)); x.setup.push(x.setup[x.setup.length - 1] ?? 0); return x; })}>+ Größe</button>
          <button type="button" className="btn alt sm" onClick={() => setM((x) => { const last = x.tiers[x.tiers.length - 1] ?? 1; x.tiers.push(last * 2); x.prices.forEach((r) => r.push(r[r.length - 1] ?? 0)); return x; })}>+ Mengenstufe</button>
          <label className="pe-lbl">Bezeichnung Einrichtung <input value={m.setupLabel} onChange={(e) => setM((x) => { x.setupLabel = e.target.value; return x; })} /></label>
          <span style={{ flex: 1 }} />
          <button type="button" className="linkbtn" onClick={() => { if (confirm('Beispielwerte für diese Tabelle wiederherstellen?')) { setP((x) => ({ ...x, [tab]: structuredClone(defaults[tab]) })); setDirty(true); } }}>Beispielwerte laden</button>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: '10px 0 0' }}>Die Mengenstufe richtet sich nach der Gesamtstückzahl der Veredelung (alle Farben und Größen mit gleichem Motiv). Motive größer als die größte Zeile werden mit der größten Zeile gerechnet und im Angebot markiert.</p>
      </div>

      <div className="pe-grid">
        <div className="box pe-box">
          <h2>Allgemein</h2>
          <label className="pe-lbl">Mindestbetrag Veredelung je Motiv (0 = keiner)
            <span className="pe-cell" style={{ maxWidth: 160 }}><N v={p.minOrder} set={(n) => { setP((x) => ({ ...x, minOrder: n })); setDirty(true); }} /><span>€</span></span>
          </label>
          <div className="pe-team">
            <label className="pe-lbl">Name je Teil<span className="pe-cell"><N v={p.team?.name ?? 0} set={(n) => { setP((x) => ({ ...x, team: { ...x.team, name: n } })); setDirty(true); }} /><span>€</span></span></label>
            <label className="pe-lbl">Nummer je Teil<span className="pe-cell"><N v={p.team?.nummer ?? 0} set={(n) => { setP((x) => ({ ...x, team: { ...x.team, nummer: n } })); setDirty(true); }} /><span>€</span></span></label>
          </div>
          <label className="pe-lbl" style={{ marginTop: 12 }}>Eigene Kosten der Veredelung (% vom Verkaufspreis) – für die Margenrechnung<span className="pe-cell" style={{ maxWidth: 160 }}><N v={p.costPct ?? 50} set={(n) => { setP((x) => ({ ...x, costPct: n })); setDirty(true); }} /><span>%</span></span></label>
          <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>Personalisierung aus der Teamliste (Namen/Nummern je Teil) – erscheint als eigene Position im Angebot.</p>
          <label className="ds-check" style={{ marginTop: 14 }}><input type="checkbox" checked={p.showEstimate} onChange={(e) => { setP({ ...p, showEstimate: e.target.checked }); setDirty(true); }} /> Kunden sehen im Shop einen „ca.“-Preis für die Veredelung</label>
          <p className="muted" style={{ fontSize: 13 }}>Alle Preise netto. Im Angebot können Sie jede Position weiterhin von Hand anpassen.</p>
          <h2 style={{ marginTop: 22 }}>Angebot & Erinnerungen</h2>
          <div className="pe-team">
            <label className="pe-lbl">Versandpauschale<span className="pe-cell"><N v={p.shipping?.flat ?? 0} set={(n) => { setP((x) => ({ ...x, shipping: { ...x.shipping, flat: n } })); setDirty(true); }} /><span>€</span></span></label>
            <label className="pe-lbl">Versandfrei ab Warenwert<span className="pe-cell"><N v={p.shipping?.freeFrom ?? 0} set={(n) => { setP((x) => ({ ...x, shipping: { ...x.shipping, freeFrom: n } })); setDirty(true); }} /><span>€</span></span></label>
          </div>
          <div className="pe-team">
            <label className="pe-lbl">Ablauf-Erinnerung (Tage vorher, 0 = aus)<span className="pe-cell"><N v={p.remind?.expiryDays ?? 3} set={(n) => { setP((x) => ({ ...x, remind: { ...x.remind, expiryDays: n } })); setDirty(true); }} /><span>Tage</span></span></label>
            <label className="pe-lbl">Rabatt bei Annahme bis Ablauf<span className="pe-cell"><N v={p.remind?.expiryPct ?? 0} set={(n) => { setP((x) => ({ ...x, remind: { ...x.remind, expiryPct: n } })); setDirty(true); }} /><span>%</span></span></label>
          </div>
          <label className="ds-check" style={{ marginTop: 10 }}><input type="checkbox" checked={p.remind?.cart !== false} onChange={(e) => { setP((x) => ({ ...x, remind: { ...x.remind, cart: e.target.checked } })); setDirty(true); }} /> Warenkorb-Erinnerung nach 24 Stunden (nur mit Einwilligung des Kunden)</label>
          <p className="muted" style={{ fontSize: 13 }}>Versand landet automatisch im Angebotsentwurf. Der Rabatt wird bei der Ablauf-Erinnerung als eigene Position ins Angebot übernommen (0 % = nur Erinnerung).</p>
        </div>
        <div className="box pe-box">
          <h2>Testrechner</h2>
          <div className="pe-test">
            <label>Verfahren<select value={t.method} onChange={(e) => setT({ ...t, method: e.target.value })}><option>Stick</option><option>Druck</option></select></label>
            <label>Motiv 1 (cm)<input inputMode="decimal" value={t.cm} onChange={(e) => setT({ ...t, cm: e.target.value })} /></label>
            <label>Motiv 2 (cm)<input inputMode="decimal" value={t.pos2} placeholder="optional" onChange={(e) => setT({ ...t, pos2: e.target.value })} /></label>
            <label>Stückzahl<input inputMode="numeric" value={t.qty} onChange={(e) => setT({ ...t, qty: e.target.value })} /></label>
          </div>
          {test && <div className="pe-result">
            {test.lines.map((l) => <div key={l.pos}><span>{l.pos}: {l.cm} cm → {l.size}{l.tooBig ? ' ⚠' : ''}</span><b>{eur(l.unit)} / Stk.</b></div>)}
            {test.setupTotal > 0 && <div><span>Einrichtung einmalig</span><b>{eur(test.setupTotal)}</b></div>}
            {test.minApplied > 0 && <div><span>Mindestbetrag-Aufschlag</span><b>{eur(test.minApplied)}</b></div>}
            <div className="pe-sum"><span>Veredelung gesamt bei {test.qty} Stk.</span><b>{eur(test.total)}</b></div>
            <div className="muted" style={{ fontSize: 13 }}>= {eur(test.total / test.qty)} je Teil</div>
          </div>}
        </div>
      </div>
    </div>
  );
}
