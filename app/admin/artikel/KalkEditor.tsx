'use client';
import { useMemo, useState } from 'react';
import { DEFAULT_KALK, curvePrice, type Kalk } from '@/lib/kalk-curve';

const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const round99 = (p: number) => Math.round((p >= 1 ? Math.ceil(p * 10) / 10 - 0.01 : p) * 100) / 100;
function N({ v, set, w = 80 }: { v: number; set: (n: number) => void; w?: number }) {
  const [t, setT] = useState<string | null>(null);
  return <input inputMode="decimal" style={{ width: w }} value={t ?? String(v).replace('.', ',')} onFocus={() => setT(String(v).replace('.', ','))} onChange={(e) => { setT(e.target.value); const n = Number(e.target.value.replace(',', '.')); if (Number.isFinite(n)) set(n); }} onBlur={() => setT(null)} />;
}

/** Kalkulation: Preiskurve EK → VK mit Vorschau */
export default function KalkEditor({ initial, items, custom }: { initial: Kalk; items: { sku: string; name: string; ek: number; category: string }[]; custom: boolean }) {
  const [k, setK] = useState<Kalk>(initial);
  const [open, setOpen] = useState(!custom);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [test, setTest] = useState(4.5);
  const up = (p: Partial<Kalk>) => { setK((x) => ({ ...x, ...p })); setDirty(true); setMsg(null); };
  const setPt = (i: number, p: Partial<{ ek: number; pct: number }>) => up({ points: k.points.map((x, n) => (n === i ? { ...x, ...p } : x)) });
  const vk = (ek: number) => round99(curvePrice(ek, k));
  const sorted = useMemo(() => [...k.points].sort((a, b) => a.ek - b.ek), [k.points]);
  const warn = sorted.some((p, i) => i > 0 && p.ek * (1 + p.pct / 100) < sorted[i - 1].ek * (1 + sorted[i - 1].pct / 100));
  async function save() {
    const r = await fetch('/api/admin/kalkulation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...k, points: sorted }) });
    setMsg(r.ok ? { ok: true, t: 'Gespeichert – alle Verkaufspreise im Shop sind sofort neu berechnet.' } : { ok: false, t: 'Fehler beim Speichern' }); if (r.ok) setDirty(false);
  }
  return (
    <div className="box imp kalk">
      <button type="button" className="imp-head" onClick={() => setOpen(!open)}>
        <b>Kalkulation: Verkaufspreise aus dem Einkaufspreis</b>
        <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>{items.length} Artikel mit EK</span>
        <span className="muted" style={{ marginLeft: 'auto' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="kalk-grid">
        <div>
          <p className="muted" style={{ marginTop: 6, fontSize: 13.5 }}>Günstige Artikel bekommen einen hohen Aufschlag, teure einen festen Gewinn. Zwischen den Stützpunkten wird gleitend gerechnet – ein teurerer Artikel ist nie günstiger als ein billigerer. Preise enden auf ,x9. Staffelrabatte (ab 10/50/100 Stk.) kommen danach.</p>
          <table className="atable kalk-t">
            <thead><tr><th>bei EK</th><th>Aufschlag</th><th>= VK</th><th>Gewinn</th><th /></tr></thead>
            <tbody>{k.points.map((p, i) => <tr key={i}>
              <td><N v={p.ek} set={(n) => setPt(i, { ek: n })} w={70} /> €</td>
              <td><N v={p.pct} set={(n) => setPt(i, { pct: n })} w={64} /> %</td>
              <td><b>{eur(vk(p.ek))}</b></td>
              <td className="muted">{eur(vk(p.ek) - p.ek)}</td>
              <td><button type="button" className="x" aria-label="Zeile löschen" onClick={() => up({ points: k.points.filter((_, n) => n !== i) })}>×</button></td>
            </tr>)}</tbody>
          </table>
          <div className="deco-row" style={{ marginTop: 8 }}>
            <button type="button" className="linkbtn" onClick={() => up({ points: [...k.points, { ek: (sorted.at(-1)?.ek ?? 10) * 1.5, pct: 30 }] })}>+ Stützpunkt</button>
            <button type="button" className="linkbtn" onClick={() => { setK(DEFAULT_KALK); setDirty(true); }}>Empfehlung wiederherstellen</button>
          </div>
          {warn && <p className="err" style={{ fontSize: 13 }}>Hinweis: Ein Stützpunkt ergibt einen niedrigeren VK als der vorherige – der Shop hebt ihn automatisch an.</p>}
          <div className="kalk-lim">
            <label>Gewinn je Stück mindestens <N v={k.minProfit} set={(n) => up({ minProfit: n })} w={60} /> €</label>
            <label>höchstens <N v={k.maxProfit} set={(n) => up({ maxProfit: n })} w={60} /> €</label>
          </div>
          <div className="deco-row" style={{ marginTop: 12, alignItems: 'center' }}>
            <button className="btn" disabled={!dirty} onClick={save}>{dirty ? 'Kalkulation speichern' : 'Gespeichert'}</button>
            {msg && <span className={msg.ok ? 'ok' : 'err'} style={{ fontSize: 13 }}>{msg.t}</span>}
          </div>
        </div>
        <div>
          <div className="kalk-test"><label>Testrechner: EK <N v={test} set={setTest} w={70} /> € → <b>{eur(vk(test))}</b> netto · Aufschlag {Math.round((vk(test) / test - 1) * 100)} % · Gewinn {eur(vk(test) - test)}</label></div>
          {items.length > 0 ? <>
            <b style={{ fontSize: 14 }}>So wirkt es auf Ihre Artikel</b>
            <table className="atable kalk-t"><thead><tr><th>Artikel</th><th>EK</th><th>VK</th><th>Aufschlag</th></tr></thead>
              <tbody>{[...items].sort((a, b) => a.ek - b.ek).slice(0, 40).map((x) => <tr key={x.sku}><td>{x.name}<div className="muted" style={{ fontSize: 12 }}>{x.sku} · {x.category}</div></td><td>{eur(x.ek)}</td><td><b>{eur(vk(x.ek))}</b></td><td>{Math.round((vk(x.ek) / x.ek - 1) * 100)} %</td></tr>)}</tbody>
            </table>
          </> : <p className="muted">Noch keine Einkaufspreise hinterlegt – sobald EK-Preise eingetragen sind, sehen Sie hier die Wirkung.</p>}
        </div>
      </div>}
    </div>
  );
}
