'use client';
import { useEffect, useState } from 'react';

type T = { sizes: string[]; head?: string; rows: [string, string, (number | string)[]][]; note?: string; shape?: 'hoodie' | 'tshirt' };
const fmt = (v: number | string) => (typeof v === 'number' ? v.toLocaleString('de-DE') : v);

/** Messskizze im Euro-Trade-Stil mit den Messpunkten A/B/C */
function Sketch({ shape }: { shape: 'hoodie' | 'tshirt' }) {
  const body = shape === 'hoodie'
    ? 'M36 18 Q50 2 64 18 L80 24 L92 74 L82 77 L74 44 L74 96 L26 96 L26 44 L18 77 L8 74 L20 24 Z'
    : 'M38 14 Q50 22 62 14 L82 22 L92 40 L78 46 L74 38 L74 96 L26 96 L26 38 L22 46 L8 40 L18 22 Z';
  return (
    <svg viewBox="0 0 100 104" className="st-sketch" aria-hidden>
      <path d={body} fill="#eef4ff" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      {shape === 'hoodie' && <path d="M40 18 Q50 30 60 18" fill="none" stroke="var(--brand)" strokeWidth="1.2" />}
      <g stroke="var(--accent)" strokeWidth="1.6" fill="var(--accent)">
        <line x1="28" y1="50" x2="72" y2="50" /><circle cx="50" cy="50" r="0" />
        <line x1="20" y1="22" x2="20" y2="96" />
        {shape === 'hoodie' ? <line x1="66" y1="22" x2="88" y2="74" /> : <line x1="64" y1="16" x2="88" y2="40" />}
      </g>
      <g fontSize="8" fontWeight="800" fill="var(--ink)">
        <text x="47" y="47">A</text><text x="12" y="62">B</text>{shape === 'hoodie' ? <text x="80" y="48">C</text> : <text x="78" y="25">C</text>}
      </g>
    </svg>
  );
}

/** Größentabelle im Euro-Trade-Design (Popup) */
export default function SizeTable({ t, name, sku, brand }: { t: T; name: string; sku: string; brand: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [open]);
  const hasLetters = t.rows.some((r) => r[0]);
  return (
    <>
      <button type="button" className="sz-link" onClick={() => setOpen(true)}>Größentabelle</button>
      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal st-modal" role="dialog" aria-modal="true" aria-labelledby="st-h" onClick={(e) => e.stopPropagation()}>
            <div className="st-top">
              <span className="st-logo"><b>euro</b><i>-trade</i><small>.com</small></span>
              <button type="button" className="st-x" onClick={() => setOpen(false)} aria-label="Schließen">×</button>
            </div>
            <div className="st-body">
              <h3 id="st-h">Größentabelle</h3>
              <p className="st-sub">{name} · {brand} · Art.-Nr. {sku}</p>
              <div className="st-grid">
                {hasLetters && t.shape && <Sketch shape={t.shape} />}
                <div className="st-wrap">
                  <table className="st-table">
                    <thead><tr><th>{t.head ?? 'Größe'}</th>{t.sizes.map((s) => <th key={s}>{s}</th>)}</tr></thead>
                    <tbody>{t.rows.map(([l, label, vals]) => <tr key={label}><th>{l && <span className="st-l">{l}</span>}{label}</th>{vals.map((v, n) => <td key={n}>{fmt(v)}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>
              <p className="st-note">Alle Maße in cm, am liegenden Kleidungsstück gemessen.{t.note ? ` ${t.note}` : ''} Die Angaben unterliegen den üblichen Toleranzen und dienen zur Orientierung.</p>
              <div className="st-foot">
                <span>Unsicher bei der Größe? Produktberatung: <a className="alink" href="tel:+493040719258">030 40719258</a></span>
                <button type="button" className="btn alt sm" onClick={() => window.print()}>Drucken / als PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
