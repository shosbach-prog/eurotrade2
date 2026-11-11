'use client';
import { useEffect, useState } from 'react';
import { SIZE_TABLE, advise, fitOf, isWomen } from '@/lib/sizing';

/** Größenberater: Brustumfang + gewünschter Sitz → Größenempfehlung */
export default function SizeAdvisor({ name, gender, sizes, extra, chart, onPick }: { name: string; gender?: string; sizes: string[]; extra?: string; chart?: string; onPick?: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [chest, setChest] = useState('');
  const [want, setWant] = useState<'eng' | 'normal' | 'locker'>('normal');
  const women0 = isWomen(gender, name);
  const [women, setWomen] = useState(women0);
  const fit = fitOf(name, extra);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [open]);
  // nur bei klassischen Konfektionsgrößen sinnvoll
  if (!sizes.some((s) => /^(XXS|XS|S|M|L|XL|XXL|[2-5]XL)$/.test(s))) return null;
  const c = Number(chest.replace(',', '.'));
  const res = c >= 60 && c <= 170 ? advise(c, sizes, { women, fit, want }) : null;
  const tab = women ? SIZE_TABLE.women : SIZE_TABLE.men;
  return (
    <>
      <button type="button" className="sz-link" onClick={() => setOpen(true)}>Welche Größe passt?</button>
      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal sa" role="dialog" aria-modal="true" aria-labelledby="sa-h" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="x" style={{ position: 'absolute', right: 12, top: 10 }} onClick={() => setOpen(false)} aria-label="Schließen">×</button>
            <h3 id="sa-h" style={{ marginTop: 0 }}>Welche Größe passt?</h3>
            <p className="muted" style={{ marginTop: -6 }}>{fit === 'oversize' ? 'Dieser Artikel ist weit geschnitten (Oversize).' : fit === 'fitted' ? 'Dieser Artikel ist figurbetont geschnitten.' : 'Dieser Artikel hat einen normalen Schnitt.'}</p>
            <div className="deco-row">
              <button type="button" className={`size ${!women ? 'on' : ''}`} onClick={() => setWomen(false)}>Herren / Unisex</button>
              <button type="button" className={`size ${women ? 'on' : ''}`} onClick={() => setWomen(true)}>Damen</button>
            </div>
            <label className="sa-l" htmlFor="sa-chest">Brustumfang (Körpermaß, cm)</label>
            <input id="sa-chest" inputMode="decimal" value={chest} onChange={(e) => setChest(e.target.value)} placeholder="z. B. 100" autoFocus />
            <small className="muted">Maßband locker unter den Achseln um die breiteste Stelle der Brust legen.</small>
            <label className="sa-l">Gewünschter Sitz</label>
            <div className="deco-row">
              {(['eng', 'normal', 'locker'] as const).map((w) => <button key={w} type="button" className={`size ${want === w ? 'on' : ''}`} onClick={() => setWant(w)}>{w}</button>)}
            </div>
            {res && (
              <div className="sa-res" aria-live="polite">
                {res.size ? <>Unsere Empfehlung: <b>{res.size}</b></> : <b>Keine Empfehlung möglich</b>}
                <small>{res.note}</small>
                {res.size && onPick && <button type="button" className="btn sm" onClick={() => { onPick(res.size!); setOpen(false); }}>Größe {res.size} übernehmen</button>}
              </div>
            )}
            <details className="sa-tab"><summary>Richtwerte Brustumfang</summary>
              <table><tbody>{tab.map(([max, s], n) => <tr key={s}><td>{s}</td><td>{n ? `${tab[n - 1][0] + 1}–${max}` : `bis ${max}`} cm</td></tr>)}</tbody></table>
            </details>
            <p className="hint">Richtwerte – je Hersteller kann es abweichen.{chart && <> Verbindlich ist die <a className="alink" href={chart} target="_blank" rel="noreferrer">Größentabelle des Herstellers</a>.</>} Unsicher? Bestellen Sie vorab ein Musterteil.</p>
          </div>
        </div>
      )}
    </>
  );
}
