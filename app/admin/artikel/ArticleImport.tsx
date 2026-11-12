'use client';
import { useState } from 'react';

/** Produktdaten per Excel/CSV ergänzen – z. B. Texte und Einkaufspreise für die Platzhalter-Artikel */
export default function ArticleImport({ placeholders }: { placeholders: number }) {
  const [open, setOpen] = useState(placeholders > 0);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [res, setRes] = useState<{ kind?: string; dry: boolean; changed: number; changes: { sku: string; fields: string[] }[]; unknown: string[]; rows?: number; articles?: number; complete?: number; colors?: number; stand?: string } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(dry: boolean) {
    setBusy(true); setErr('');
    const fd = new FormData(); fd.append('file', file!); fd.append('dry', dry ? '1' : '0');
    const r = await fetch('/api/admin/artikel/import', { method: 'POST', body: fd });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(d.error ?? `Fehler beim Hochladen (${r.status}${r.status === 413 ? ' – Datei zu groß' : ''})`); setRes(null); return; }
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
          <li><b>Hier hochladen</b> – direkt als Excel-Datei (.xlsx) oder CSV. Auch die <b>L-Shop-Auslaufliste</b> (Excel) kann hier direkt hochgeladen werden, sie wird automatisch erkannt.</li>
        </ol>
        <div className="deco-row">
          <label className="btn alt sm upl">{name || 'Excel- oder CSV-Datei wählen'}<input type="file" hidden accept=".xlsx,.csv,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setName(f.name); setFile(f); setRes(null); setErr(''); }} /></label>
          <button className="btn alt sm" disabled={!file || busy} onClick={() => run(true)}>{busy && !res ? 'Liest …' : 'Vorschau'}</button>
          <button className="btn sm" disabled={!file || busy || !res?.dry || (res.kind !== 'auslauf' && !res.changed)} onClick={() => run(false)}>{busy ? 'Spielt ein …' : res?.kind === 'auslauf' ? 'Auslaufliste übernehmen' : `${res?.changed ?? ''} Artikel übernehmen`}</button>
        </div>
        {err && <p className="err">{err}</p>}
        {res?.kind === 'auslauf' && <div className="imp-res">
          <p className={res.dry ? '' : 'ok'}><b>{res.dry ? 'L-Shop-Auslaufliste erkannt' : '✓ Auslaufliste übernommen'}</b> (Stand {res.stand})</p>
          <p>{res.rows?.toLocaleString('de-DE')} Zeilen gelesen · betrifft <b>{res.articles} Artikel</b> im Shop, davon {res.complete} komplett · {res.colors} Farben</p>
          {res.dry && <p className="muted" style={{ fontSize: 13 }}>Nach dem Übernehmen zeigt der Shop die Hinweise „läuft aus“ – nach dem Auslaufdatum werden Artikel, Farben und Größen automatisch ausgeblendet.</p>}
        </div>}
        {res && res.kind !== 'auslauf' && <div className="imp-res">
          <p className={res.dry ? '' : 'ok'}><b>{res.dry ? `${res.changed} Artikel werden geändert:` : `✓ ${res.changed} Artikel aktualisiert.`}</b></p>
          {res.dry && <ul>{res.changes.slice(0, 30).map((c) => <li key={c.sku}><b>{c.sku}</b>: {c.fields.join(', ')}</li>)}{res.changes.length > 30 && <li className="muted">… und {res.changes.length - 30} weitere</li>}</ul>}
          {res.unknown.length > 0 && <p className="err" style={{ fontSize: 13 }}>Nicht gefunden: {res.unknown.join(', ')}</p>}
        </div>}
      </div>}
    </div>
  );
}
