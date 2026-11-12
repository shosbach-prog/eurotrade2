'use client';
import { useState } from 'react';

type Miss = { q: string; n: number; first: string; last: string };
/** Suchbegriffe, zu denen Besucher nichts gefunden haben */
export default function SearchMisses({ initial }: { initial: Miss[] }) {
  const [list, setList] = useState(initial);
  const [open, setOpen] = useState(false);
  const done = async (q?: string) => {
    await fetch('/api/admin/suche', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q ? { q } : {}) });
    setList((l) => (q ? l.filter((x) => x.q !== q) : []));
  };
  return (
    <section className="box sm-box">
      <button type="button" className="sm-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <b>Suchen ohne Treffer</b> {list.length > 0 ? <span className="tag tag-warn">{list.length}</span> : <span className="muted">keine</span>}
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 13 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <>
        <p className="muted" style={{ marginTop: 6, fontSize: 13.5 }}>Wonach Besucher gesucht und nichts gefunden haben. Tipp: fehlende Artikel aufnehmen oder Begriffe als Merkmal/Tag in den Artikeltext übernehmen.</p>
        {list.length ? <table className="atable"><thead><tr><th>Suchbegriff</th><th className="r">Anzahl</th><th>zuletzt</th><th /></tr></thead>
          <tbody>{list.slice(0, 50).map((m) => <tr key={m.q}>
            <td><a className="alink" href={`/suche?q=${encodeURIComponent(m.q)}`} target="_blank" rel="noreferrer">{m.q}</a></td>
            <td className="r"><b>{m.n}</b></td>
            <td className="muted">{new Date(m.last).toLocaleDateString('de-DE')}</td>
            <td className="r"><button type="button" className="linkbtn" onClick={() => done(m.q)}>erledigt</button></td>
          </tr>)}</tbody></table> : <p className="muted">Bisher keine Suchen ohne Treffer.</p>}
        {list.length > 1 && <button type="button" className="linkbtn" onClick={() => done()}>Liste leeren</button>}
      </>}
    </section>
  );
}
