'use client';
import { useState } from 'react';

/** Produktdaten per Excel/CSV ergänzen – z. B. Texte und Einkaufspreise für die Platzhalter-Artikel */
export default function ArticleImport({ placeholders }: { placeholders: number }) {
  const [open, setOpen] = useState(placeholders > 0);
  const [csv, setCsv] = useState('');
  const [name, setName] = useState('');
  const [res, setRes] = useState<{ dry: boolean; changed: number; changes: { sku: string; fields: string[] }[]; unknown: string[] } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(dry: boolean) {
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/artikel/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv, dry }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(d.error ?? 'Fehler'); setRes(null); return; }
    setRes(d);
    if (!dry) setTimeout(() => location.reload(), 1200);
  }
  return (
    <div className="box imp">
      <button type="button" className="imp-head" onClick={() => setOpen(!open)}>
        <b>Produktdaten per Excel ergänzen</b>
        {placeholders > 0 && <span className="nav-badge">{placeholders} Platzhalter</span>}
        <span className="muted" style={{ marginLeft: 'auto' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ marginTop: 10 }}>
        <ol className="imp-steps">
          <li><b>Vorlage laden:</b> <a className="alink" href="/api/admin/artikel/import?nur=platzhalter">nur Platzhalter-Artikel ({placeholders})</a> · <a className="alink" href="/api/admin/artikel/import">alle Artikel</a></li>
          <li><b>In Excel ausfüllen:</b> Beschreibung, Merkmale (getrennt mit |), Material, Zusammensetzung, EK-Preis, Staffel (z. B. <code>10:5,90 50:5,40</code>). Leere Zellen bleiben unverändert.</li>
          <li><b>Speichern als</b> „CSV UTF-8 (Trennzeichen-getrennt)“ und hier hochladen.</li>
        </ol>
        <div className="deco-row">
          <label className="btn alt sm upl">{name || 'CSV-Datei wählen'}<input type="file" hidden accept=".csv,.txt" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setName(f.name); setCsv(await f.text()); setRes(null); }} /></label>
          <button className="btn alt sm" disabled={!csv || busy} onClick={() => run(true)}>Vorschau</button>
          <button className="btn sm" disabled={!csv || busy || !res?.dry || !res.changed} onClick={() => run(false)}>{busy ? 'Spielt ein …' : `${res?.changed ?? ''} Artikel übernehmen`}</button>
        </div>
        {err && <p className="err">{err}</p>}
        {res && <div className="imp-res">
          <p className={res.dry ? '' : 'ok'}><b>{res.dry ? `${res.changed} Artikel werden geändert:` : `✓ ${res.changed} Artikel aktualisiert.`}</b></p>
          {res.dry && <ul>{res.changes.slice(0, 30).map((c) => <li key={c.sku}><b>{c.sku}</b>: {c.fields.join(', ')}</li>)}{res.changes.length > 30 && <li className="muted">… und {res.changes.length - 30} weitere</li>}</ul>}
          {res.unknown.length > 0 && <p className="err" style={{ fontSize: 13 }}>Nicht gefunden: {res.unknown.join(', ')}</p>}
        </div>}
      </div>}
    </div>
  );
}
