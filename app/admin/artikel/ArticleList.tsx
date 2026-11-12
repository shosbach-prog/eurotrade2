'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export type Row = {
  id: string; name: string; sku: string; brand: string; category: string; ek: number | null; vk: number | null;
  hidden: boolean; top: boolean; changed: boolean; custom: boolean; text: 'eigen' | 'vorlage' | 'automatisch';
  img: string | null; colors: number; placeholder: boolean; eol?: string | null; sale?: number | null;
};
type Status = 'alle' | 'sichtbar' | 'aus' | 'ohne-preis' | 'platzhalter' | 'geaendert' | 'auslauf' | 'angebot';
const PER = 50;
const eur = (n: number | null) => (n == null ? '–' : n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }));
const TXT = { eigen: ['Eigener Text', 'st-angenommen'], vorlage: ['Vorlage', 'st-angebot'], automatisch: ['Automatisch', 'st-neu'] } as const;

export default function ArticleList({ rows: init, categories }: { rows: Row[]; categories: string[] }) {
  const [rows, setRows] = useState(init);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>('alle');
  const [cat, setCat] = useState('');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState<'standard' | 'name' | 'kategorie' | 'preis'>('standard');
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; t: string } | null>(null);
  const say = (ok: boolean, t: string) => { setToast({ ok, t }); setTimeout(() => setToast(null), 3500); };
  const brands = useMemo(() => [...new Set(rows.map((r) => r.brand).filter(Boolean))].sort(), [rows]);

  const count = (s: Status) => rows.filter((r) => match(r, s)).length;
  function match(r: Row, s: Status) {
    return s === 'alle' || (s === 'sichtbar' && !r.hidden) || (s === 'aus' && r.hidden) || (s === 'ohne-preis' && r.ek == null) || (s === 'platzhalter' && r.placeholder) || (s === 'geaendert' && (r.changed || r.custom)) || (s === 'auslauf' && !!r.eol) || (s === 'angebot' && r.sale != null);
  }
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let f = rows.filter((r) => match(r, status) && (!cat || r.category === cat) && (!brand || r.brand === brand) && (!t || `${r.name} ${r.sku} ${r.brand}`.toLowerCase().includes(t)));
    if (sort === 'name') f = [...f].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    if (sort === 'kategorie') f = [...f].sort((a, b) => a.category.localeCompare(b.category, 'de') || a.name.localeCompare(b.name, 'de'));
    if (sort === 'preis') f = [...f].sort((a, b) => (a.ek ?? 1e9) - (b.ek ?? 1e9));
    return f;
  }, [rows, q, status, cat, brand, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const pg = Math.min(page, pages - 1);
  const shown = filtered.slice(pg * PER, pg * PER + PER);
  const reset = () => setPage(0);

  const allShownSel = shown.length > 0 && shown.every((r) => sel.has(r.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleShown = () => setSel((s) => { const n = new Set(s); shown.forEach((r) => (allShownSel ? n.delete(r.id) : n.add(r.id))); return n; });
  const selectFiltered = () => setSel(new Set(filtered.map((r) => r.id)));

  async function bulk(patch: { hidden?: boolean; category?: string; top?: boolean; sale?: { pct: number } | null }, ids = [...sel]) {
    if (!ids.length) return;
    setBusy(true);
    const r = await fetch('/api/admin/artikel', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, patch }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { say(false, d.error ?? 'Fehler beim Speichern'); return; }
    setRows((rs) => rs.map((x) => (ids.includes(x.id) ? { ...x, ...patch, sale: 'sale' in patch ? (patch.sale ? patch.sale.pct : null) : x.sale, changed: !x.custom || x.changed } : x)));
    say(true, `${ids.length} Artikel ${patch.hidden === false ? 'sichtbar geschaltet' : patch.hidden ? 'ausgeblendet' : patch.category ? `nach „${patch.category}“ verschoben` : patch.top ? 'als Top markiert' : patch.sale ? `als Sonderangebot markiert${patch.sale.pct ? ` (−${patch.sale.pct} %)` : ''}` : 'sale' in patch ? 'aus den Sonderangeboten genommen' : 'aktualisiert'}.`);
    if (ids.length > 1) setSel(new Set());
  }

  return (
    <div className="al">
      <div className="al-tools">
        <input className="cm-search" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="Suchen nach Name, Artikelnummer, Marke …" aria-label="Artikel suchen" />
        <select value={cat} onChange={(e) => { setCat(e.target.value); reset(); }} aria-label="Kategorie"><option value="">Alle Kategorien</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={brand} onChange={(e) => { setBrand(e.target.value); reset(); }} aria-label="Marke"><option value="">Alle Marken</option>{brands.map((b) => <option key={b}>{b}</option>)}</select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sortierung">
          <option value="standard">Sortierung: Shop-Reihenfolge</option><option value="name">Name A–Z</option><option value="kategorie">Kategorie</option><option value="preis">Einkaufspreis</option>
        </select>
      </div>
      <div className="cm-filters al-filters" role="tablist">
        {([['alle', 'Alle'], ['sichtbar', 'Sichtbar'], ['aus', 'Ausgeblendet'], ['ohne-preis', 'Ohne Preis'], ['platzhalter', 'Platzhalter'], ['geaendert', 'Bearbeitet'], ['auslauf', 'Auslauf'], ['angebot', 'Sonderangebot']] as [Status, string][]).map(([s, l]) => (
          <button key={s} role="tab" aria-selected={status === s} className={status === s ? 'on' : ''} onClick={() => { setStatus(s); reset(); }}>{l} <span>{count(s)}</span></button>
        ))}
      </div>

      {sel.size > 0 && (
        <div className="al-bulk">
          <b>{sel.size} ausgewählt</b>
          {sel.size < filtered.length && <button className="linkbtn" onClick={selectFiltered}>Alle {filtered.length} Treffer auswählen</button>}
          <span style={{ flex: 1 }} />
          <button className="btn sm btn-approve" disabled={busy} onClick={() => bulk({ hidden: false })}>Sichtbar schalten</button>
          <button className="btn alt sm" disabled={busy} onClick={() => bulk({ hidden: true })}>Ausblenden</button>
          <select disabled={busy} value="" onChange={(e) => e.target.value && bulk({ category: e.target.value })} aria-label="Kategorie setzen">
            <option value="">Kategorie setzen …</option>{categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select disabled={busy} value="" onChange={(e) => { const v = e.target.value; if (v === 'off') bulk({ sale: null }); else if (v) bulk({ sale: { pct: Number(v) } }); }} aria-label="Sonderangebot">
            <option value="">Sonderangebot …</option><option value="0">markieren (ohne Rabatt)</option>{[5, 10, 15, 20, 25, 30, 40, 50].map((n) => <option key={n} value={n}>markieren mit −{n} %</option>)}<option value="off">kein Sonderangebot mehr</option>
          </select>
          <button className="linkbtn" onClick={() => setSel(new Set())}>Auswahl aufheben</button>
        </div>
      )}

      <div className="al-table">
        <div className="al-row al-th">
          <span><input type="checkbox" checked={allShownSel} onChange={toggleShown} aria-label="Alle auf dieser Seite auswählen" /></span>
          <span /><span>Artikel</span><span>Kategorie</span><span className="r">EK</span><span className="r">VK</span><span>Sichtbar</span><span />
        </div>
        {!shown.length && <div className="al-empty muted">Keine Artikel für diese Auswahl.</div>}
        {shown.map((r) => (
          <div key={r.id} className={`al-row ${r.hidden ? 'off' : ''} ${sel.has(r.id) ? 'sel' : ''}`}>
            <span><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} aria-label={`${r.name} auswählen`} /></span>
            <span>{r.img ? <img src={r.img} alt="" loading="lazy" /> : <span className="ae-noimg" />}</span>
            <span className="al-name">
              <Link href={`/admin/artikel/${r.id}`}><b>{r.name}</b></Link>
              <span className="muted">{r.sku} · {r.brand}{r.colors ? ` · ${r.colors} Farben` : ''}</span>
              <span className="al-tags">
                {r.top && <span className="tag tag-ok">★ Top</span>}
                {r.placeholder && <span className="tag tag-warn">Platzhalter</span>}
                {r.sale != null && <span className="tag tag-sale">Sonderangebot{r.sale ? ` −${r.sale} %` : ''}</span>}
                {r.eol && <span className="tag tag-warn" title="laut L-Shop-Auslaufliste">⏳ {r.eol}</span>}
                {r.custom ? <span className="tag">eigener Artikel</span> : r.changed && <span className="tag">bearbeitet</span>}
                <span className={`st ${TXT[r.text][1]}`} style={{ fontSize: 11 }}>{TXT[r.text][0]}</span>
              </span>
            </span>
            <span className="al-cat">{r.category}</span>
            <span className="r">{eur(r.ek)}</span>
            <span className="r">{r.vk == null ? <span className="muted">auf Anfrage</span> : eur(r.vk)}</span>
            <span><button type="button" className={`switch ${!r.hidden ? 'on' : ''}`} role="switch" aria-checked={!r.hidden} aria-label={`${r.name} ${r.hidden ? 'sichtbar schalten' : 'ausblenden'}`} disabled={busy} onClick={() => bulk({ hidden: !r.hidden }, [r.id])}><i /></button></span>
            <span className="r"><Link className="btn alt sm" href={`/admin/artikel/${r.id}`}>Bearbeiten</Link></span>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="al-pages">
          <button className="btn alt sm" disabled={pg === 0} onClick={() => setPage(pg - 1)}>← Zurück</button>
          <span className="muted">Seite {pg + 1} von {pages} · {filtered.length} Artikel</span>
          <button className="btn alt sm" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Weiter →</button>
        </div>
      )}
      {toast && <div className={`cm-toast ${toast.ok ? 'ok' : 'err'}`} role="status">{toast.t}</div>}
    </div>
  );
}
