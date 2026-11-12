'use client';
import { useEffect, useMemo, useState } from 'react';

export type PickItem = { id: string; sku: string; name: string; brand: string; category: string; categorySlug?: string; gender?: string; image?: string | null; colors?: number; tags?: string[] };
/** Zusätzliche Filter wie im Mega-Menü; title „_sub“ = Unterkategorien (erscheinen bei der gewählten Kategorie) */
export type PickGroup = { title: string; entries: { key: string; label: string; count: number; cat?: string }[] };

/**
 * Artikelauswahl für viele Artikel: Kategorie → Zielgruppe/Marke → Suche, Kacheln mit Bild,
 * Mehrfachauswahl („alle im Filter“), ausgewählte Artikel oben sichtbar und sortierbar.
 */
export default function ArticlePicker({ items, groups = [], value, onChange, title = 'Artikel auswählen', onClose }: {
  items: PickItem[]; groups?: PickGroup[]; value: string[]; onChange: (ids: string[]) => void; title?: string; onClose: () => void;
}) {
  const [cat, setCat] = useState('');
  const [tag, setTag] = useState('');
  const [sub, setSub] = useState('');
  const [tcat, setTcat] = useState('');
  const [g, setG] = useState('');
  const [brand, setBrand] = useState('');
  const [q, setQ] = useState('');
  const [onlySel, setOnlySel] = useState(false);
  const [limit, setLimit] = useState(60);
  const sel = useMemo(() => new Set(value), [value]);
  const byId = useMemo(() => new Map(items.map((p) => [p.id, p])), [items]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  useEffect(() => setLimit(60), [cat, tag, sub, g, brand, q, onlySel]);

  const cats = useMemo(() => { const m = new Map<string, number>(); items.forEach((p) => m.set(p.category, (m.get(p.category) ?? 0) + 1)); return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'de')); }, [items]);
  const inCat = useMemo(() => items.filter((p) => (!cat || p.category === cat) && (!tag || p.tags?.includes(tag))), [items, cat, tag]);
  const catSlug = cat ? items.find((p) => p.category === cat)?.categorySlug : undefined;
  const subs = (groups.find((x) => x.title === '_sub')?.entries ?? []).filter((e) => catSlug && e.cat === catSlug);
  const side = groups.filter((x) => x.title !== '_sub' && x.entries.length);
  const pickCat = (c: string) => { setCat(c); setTcat(''); setTag(''); setSub(''); setBrand(''); setG(''); setOnlySel(false); };
  const pickTag = (t: string) => { setTag(t); setTcat(''); setCat(''); setSub(''); setBrand(''); setG(''); setOnlySel(false); };
  const brands = useMemo(() => { const m = new Map<string, number>(); inCat.forEach((p) => m.set(p.brand, (m.get(p.brand) ?? 0) + 1)); return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'de')); }, [inCat]);
  const gens = ['Damen', 'Herren', 'Kinder', 'Unisex'].filter((x) => inCat.some((p) => (p.gender ?? 'Unisex') === x));
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const list = useMemo(() => (onlySel ? value.map((id) => byId.get(id)!).filter(Boolean) : inCat.filter((p) =>
    (!g || (p.gender ?? 'Unisex') === g) && (!brand || p.brand === brand) && (!sub || p.tags?.includes(sub)) && (!tcat || p.category === tcat) &&
    words.every((w) => `${p.sku} ${p.name} ${p.brand}`.toLowerCase().includes(w)))), [onlySel, value, byId, inCat, g, brand, sub, tcat, words.join(' ')]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => onChange(sel.has(id) ? value.filter((x) => x !== id) : [...value, id]);
  const allOn = list.length > 0 && list.every((p) => sel.has(p.id));
  const toggleAll = () => onChange(allOn ? value.filter((id) => !list.some((p) => p.id === id)) : [...value, ...list.filter((p) => !sel.has(p.id)).map((p) => p.id)]);
  const move = (id: string, d: number) => { const i = value.indexOf(id), j = i + d; if (j < 0 || j >= value.length) return; const n = [...value]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };

  return (
    <div className="ap-bg" onClick={onClose}>
      <div className="ap" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="ap-head">
          <b>{title}</b>
          <span className="muted">{value.length} ausgewählt</span>
          <button type="button" className="btn sm" onClick={onClose}>Fertig</button>
        </div>
        <div className="ap-body">
          <aside className="ap-cats">
            <span className="ap-sh">Kategorien</span>
            <button type="button" className={!cat && !tag ? 'on' : ''} onClick={() => pickCat('')}>Alle Artikel <span>{items.length}</span></button>
            {cats.map(([c, n]) => <button key={c} type="button" className={cat === c ? 'on' : ''} onClick={() => pickCat(c)}>{c} <span>{n}</span></button>)}
            {side.map((gr) => <div key={gr.title} className="ap-side">
              <span className="ap-sh">{gr.title}</span>
              {gr.entries.map((e) => <button key={e.key} type="button" className={tag === e.key ? 'on' : ''} onClick={() => pickTag(e.key)}>{e.label} <span>{e.count}</span></button>)}
            </div>)}
            <button type="button" className={`ap-selbtn ${onlySel ? 'on' : ''}`} onClick={() => setOnlySel(!onlySel)}>✓ Ausgewählte <span>{value.length}</span></button>
          </aside>
          <section className="ap-main">
            {!onlySel && subs.length > 0 && <div className="ap-subs">
              <button type="button" className={!sub ? 'on' : ''} onClick={() => setSub('')}>Alle {cat}</button>
              {subs.map((e) => <button key={e.key} type="button" className={sub === e.key ? 'on' : ''} onClick={() => setSub(e.key)}>{e.label} <span>{e.count}</span></button>)}
            </div>}
            {!onlySel && tag && <div className="ap-subs">
              <button type="button" className={!tcat ? 'on' : ''} onClick={() => setTcat('')}>Alle Kategorien</button>
              {[...new Map(inCat.map((p) => [p.category, inCat.filter((x) => x.category === p.category).length])).entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => <button key={c} type="button" className={tcat === c ? 'on' : ''} onClick={() => setTcat(c)}>{c} <span>{n}</span></button>)}
            </div>}
            {!onlySel && <div className="ap-filters">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Suchen${cat ? ` in ${cat}` : tag ? ` in ${side.flatMap((x) => x.entries).find((e) => e.key === tag)?.label ?? ''}` : ''}: Name, Art.-Nr., Marke …`} />
              <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Marke"><option value="">Alle Marken</option>{brands.map(([b, n]) => <option key={b} value={b}>{b} ({n})</option>)}</select>
              <div className="ap-g">{['', ...gens].map((x) => <button key={x || 'alle'} type="button" className={g === x ? 'on' : ''} onClick={() => setG(x)}>{x || 'Alle'}</button>)}</div>
            </div>}
            <div className="ap-bar">
              <span className="muted">{list.length} Artikel</span>
              {list.length > 0 && <button type="button" className="linkbtn" onClick={toggleAll}>{allOn ? 'Auswahl im Filter aufheben' : `Alle ${list.length} auswählen`}</button>}
              {value.length > 0 && <button type="button" className="linkbtn" style={{ marginLeft: 'auto' }} onClick={() => onChange([])}>Auswahl leeren</button>}
            </div>
            <div className="ap-grid">
              {list.slice(0, limit).map((p) => (
                <div key={p.id} className={`ap-card ${sel.has(p.id) ? 'on' : ''}`}>
                  <button type="button" className="ap-pick" onClick={() => toggle(p.id)} aria-pressed={sel.has(p.id)}>
                    <span className="ap-img">{p.image ? <img src={p.image} alt="" loading="lazy" /> : null}<i>{sel.has(p.id) ? '✓' : '+'}</i></span>
                    <b>{p.name}</b>
                    <small>{p.sku} · {p.brand}{p.colors ? ` · ${p.colors} Farben` : ''}</small>
                  </button>
                  {onlySel && <span className="ap-ord"><button type="button" onClick={() => move(p.id, -1)} aria-label="nach vorn">←</button><button type="button" onClick={() => move(p.id, 1)} aria-label="nach hinten">→</button></span>}
                </div>
              ))}
            </div>
            {list.length > limit && <button type="button" className="btn alt sm ap-more" onClick={() => setLimit(limit + 60)}>Weitere {Math.min(60, list.length - limit)} anzeigen</button>}
            {!list.length && <p className="muted" style={{ padding: 20 }}>{onlySel ? 'Noch nichts ausgewählt.' : 'Keine Artikel für diese Auswahl.'}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}

/** Kompakte Vorschau der Auswahl im Formular */
export function PickedStrip({ items, value, onOpen, onRemove }: { items: PickItem[]; value: string[]; onOpen: () => void; onRemove: (id: string) => void }) {
  const byId = new Map(items.map((p) => [p.id, p]));
  return (
    <div className="ap-strip">
      <button type="button" className="btn alt sm" onClick={onOpen}>{value.length ? 'Artikel ändern …' : '+ Artikel auswählen'}</button>
      <div className="ap-thumbs">
        {value.map((id) => { const p = byId.get(id); return (
          <span key={id} className="ap-thumb" title={p ? `${p.sku} – ${p.name}` : id}>
            {p?.image ? <img src={p.image} alt="" /> : <em>{p?.sku ?? id}</em>}
            <button type="button" onClick={() => onRemove(id)} aria-label="entfernen">×</button>
          </span>
        ); })}
      </div>
    </div>
  );
}
