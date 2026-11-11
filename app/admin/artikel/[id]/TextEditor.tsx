'use client';
import { useState } from 'react';

type T = { headline: string; intro: string; highlights: string[]; idealFor: string };
export default function TextEditor({ id, initial, source, auto, seed }: { id: string; initial: T; source: string; auto: T; seed: T | null }) {
  const [t, setT] = useState<T>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; m: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const set = (p: Partial<T>) => { setT((x) => ({ ...x, ...p })); setDirty(true); };
  async function save(reset = false) {
    const r = await fetch('/api/admin/texte', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, text: reset ? null : t }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setDirty(false); setMsg({ ok: true, m: reset ? 'Eigener Text entfernt – es gilt wieder die Vorlage bzw. der automatische Text.' : 'Gespeichert – sofort im Shop sichtbar.' }); if (reset) setT(seed ?? auto); }
    else setMsg({ ok: false, m: d.error ?? 'Fehler' });
  }
  const len = t.intro.length;
  return (
    <div className="box form te">
      <div className="muted" style={{ fontSize: 13 }}>Aktuell: {source === 'eigen' ? 'bearbeiteter Text' : source === 'vorlage' ? 'redaktionelle Vorlage' : 'automatisch aus den Produktdaten'}</div>
      <label>Überschrift</label>
      <input value={t.headline} maxLength={80} onChange={(e) => set({ headline: e.target.value })} />
      <label>Einleitung <span className="muted" style={{ fontWeight: 400 }}>({len} Zeichen · ideal 300–600, Leerzeile = neuer Absatz)</span></label>
      <textarea value={t.intro} onChange={(e) => set({ intro: e.target.value })} style={{ minHeight: 170 }} />
      <label>Highlights <span className="muted" style={{ fontWeight: 400 }}>(eine Zeile pro Punkt, 3–5 empfohlen)</span></label>
      <textarea value={t.highlights.join('\n')} onChange={(e) => set({ highlights: e.target.value.split('\n') })} style={{ minHeight: 120 }} />
      <label>Ideal für <span className="muted" style={{ fontWeight: 400 }}>(mit Komma getrennt)</span></label>
      <input value={t.idealFor} onChange={(e) => set({ idealFor: e.target.value })} />
      <div className="admin-actions">
        <button className="btn" disabled={!dirty} onClick={() => save()}>Speichern</button>
        <button className="btn alt" onClick={() => { setT(auto); setDirty(true); }}>Aus Produktdaten neu erzeugen</button>
        {seed && <button className="btn alt" onClick={() => { setT(seed); setDirty(true); }}>Redaktionelle Vorlage laden</button>}
        {source === 'eigen' && <button className="linkbtn" onClick={() => save(true)}>Eigenen Text verwerfen</button>}
      </div>
      {msg && <div className={`note ${msg.ok ? 'ok' : 'err'}`}>{msg.m}</div>}
      <div className="te-prev">
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Vorschau</div>
        <div className="ptext" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
          <h2>{t.headline}</h2>
          {t.intro.split(/\n\s*\n/).map((x, k) => <p key={k}>{x}</p>)}
          <ul className="hl">{t.highlights.filter((h) => h.trim()).map((h, k) => <li key={k}>{h}</li>)}</ul>
          {t.idealFor && <div className="ideal"><span>Ideal für:</span>{t.idealFor.split(',').filter((x) => x.trim()).map((x, k) => <b key={k}>{x.trim()}</b>)}</div>}
        </div>
      </div>
    </div>
  );
}
