'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProductCard from './ProductCard';
import { brandLogo } from '@/lib/brands';
import type { PublicProduct } from '@/lib/types';
import { FAMILY_HEX, colorFamily } from '@/lib/colors';
import { eur } from '@/lib/format';
import { usePrice } from './PriceMode';

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];
const sizeRank = (s: string) => { const i = SIZE_ORDER.indexOf(s); return i >= 0 ? i : 100 + (parseFloat(s) || 0); };
const minPrice = (p: PublicProduct) => (p.price == null ? null : p.tiers.length ? p.tiers[p.tiers.length - 1].price : p.price);

type Sort = 'empfohlen' | 'preis' | 'preis-ab' | 'name';

/** Produktliste mit Filtern: Marke, Farbe, Größe, Schnitt, Preis + Sortierung */
export default function FilterGrid({ items }: { items: PublicProduct[] }) {
  const pr = usePrice();
  const [brands, setBrands] = useState<string[]>([]);
  const [fams, setFams] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [props, setProps] = useState<string[]>([]);
  const [maxP, setMaxP] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>('empfohlen');
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState<string | null>(null);
  const [limit, setLimit] = useState(24);
  // Lazy Load: weitere Artikel automatisch nachladen, sobald das Ende der Liste in Sicht kommt
  const more = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = more.current; if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setLimit((l) => l + 24); }, { rootMargin: '800px 0px' });
    io.observe(el); return () => io.disconnect();
  });
  const barRef = useRef<HTMLElement>(null);
  // Dropdown bleibt offen, bis man daneben klickt oder Esc drückt (nicht mehr beim Verlassen mit der Maus)
  useEffect(() => {
    if (!dd) return;
    const down = (e: PointerEvent) => { if (!barRef.current?.contains(e.target as Node)) setDd(null); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setDd(null); };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
  }, [dd]);

  const facets = useMemo(() => {
    const count = (vals: string[][]) => { const m = new Map<string, number>(); vals.forEach((v) => new Set(v).forEach((x) => m.set(x, (m.get(x) ?? 0) + 1))); return m; };
    const prices = items.map(minPrice).filter((x): x is number => x != null);
    return {
      brand: [...count(items.map((p) => [p.brand])).entries()].sort((a, b) => a[0].localeCompare(b[0])),
      fam: [...count(items.map((p) => p.colors.map(colorFamily))).entries()].sort((a, b) => Object.keys(FAMILY_HEX).indexOf(a[0]) - Object.keys(FAMILY_HEX).indexOf(b[0])),
      size: [...count(items.map((p) => p.sizes)).entries()].filter(([s]) => s.length <= 6).sort((a, b) => sizeRank(a[0]) - sizeRank(b[0])),
      gender: [...count(items.map((p) => [p.gender ?? 'Unisex'])).entries()],
      props: [...count(items.map((p) => p.props ?? [])).entries()].sort((a, b) => b[1] - a[1]),
      max: prices.length ? Math.ceil(Math.max(...prices)) : 0, min: prices.length ? Math.floor(Math.min(...prices)) : 0,
    };
  }, [items]);

  const shown = useMemo(() => {
    let r = items.filter((p) =>
      (!brands.length || brands.includes(p.brand)) &&
      (!fams.length || p.colors.some((c) => fams.includes(colorFamily(c)))) &&
      (!sizes.length || sizes.some((s) => p.sizes.includes(s))) &&
      (!genders.length || genders.includes(p.gender ?? 'Unisex')) &&
      (!props.length || props.every((x) => p.props?.includes(x))) &&
      (maxP == null || (minPrice(p) ?? 0) <= maxP));
    if (sort === 'preis') r = [...r].sort((a, b) => (minPrice(a) ?? 1e9) - (minPrice(b) ?? 1e9));
    if (sort === 'preis-ab') r = [...r].sort((a, b) => (minPrice(b) ?? -1) - (minPrice(a) ?? -1));
    if (sort === 'name') r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [items, brands, fams, sizes, genders, props, maxP, sort]);

  const tog = (set: (f: (x: string[]) => string[]) => void, v: string) => set((x) => (x.includes(v) ? x.filter((y) => y !== v) : [...x, v]));
  const active = brands.length + fams.length + sizes.length + genders.length + props.length + (maxP != null ? 1 : 0);
  const reset = () => { setBrands([]); setFams([]); setSizes([]); setGenders([]); setProps([]); setMaxP(null); };

  const grp = (id: string, label: string, n: number, body: React.ReactNode) => (
    <div className={`f-group ${dd === id ? 'open' : ''} ${n ? 'act' : ''}`}>
      <button type="button" className="f-btn" onClick={() => setDd(dd === id ? null : id)} aria-expanded={dd === id}>{label}{n ? <span className="f-n">{n}</span> : null}<span className="f-car">▾</span></button>
      <div className="f-pop">{body}</div>
    </div>
  );
  const panel = (
    <aside ref={barRef} className={`filters ${open ? 'open' : ''}`}>
      <div className="f-head"><strong>Filter</strong>{active > 0 && <button className="linkbtn" onClick={reset}>zurücksetzen</button>}<button className="x f-close" onClick={() => setOpen(false)} aria-label="Filter schließen">×</button></div>
      {facets.fam.length > 1 && grp('fam', 'Farbe', fams.length, <div className="f-fams">{facets.fam.map(([f, n]) => (
        <button key={f} className={`f-fam ${fams.includes(f) ? 'on' : ''}`} onClick={() => tog(setFams, f)} title={`${f} (${n})`}><span style={{ background: FAMILY_HEX[f] }} />{f}</button>))}</div>)}
      {facets.size.length > 1 && grp('size', 'Größe', sizes.length, <div className="f-sizes">{facets.size.map(([s]) => <button key={s} className={`size ${sizes.includes(s) ? 'on' : ''}`} onClick={() => tog(setSizes, s)}>{s}</button>)}</div>)}
      {facets.gender.length > 1 && grp('gender', 'Schnitt', genders.length, <>{facets.gender.map(([g, n]) => <label key={g} className="f-check"><input type="checkbox" checked={genders.includes(g)} onChange={() => tog(setGenders, g)} />{g}<span>{n}</span></label>)}</>)}
      {facets.props.length > 0 && grp('props', 'Eigenschaften', props.length, <>{facets.props.map(([g, n]) => <label key={g} className="f-check"><input type="checkbox" checked={props.includes(g)} onChange={() => tog(setProps, g)} />{g}<span>{n}</span></label>)}</>)}
      {facets.brand.length > 1 && grp('brand', 'Marke', brands.length, <>{facets.brand.map(([b, n]) => <label key={b} className="f-check"><input type="checkbox" checked={brands.includes(b)} onChange={() => tog(setBrands, b)} />{brandLogo(b) && <img className="f-blogo" src={brandLogo(b)!} alt="" loading="lazy" />}{b}<span>{n}</span></label>)}</>)}
      {facets.max > facets.min && grp('price', 'Preis', maxP != null ? 1 : 0, <><b style={{ fontSize: 13 }}>bis {pr.p(maxP ?? facets.max)}</b><input type="range" min={facets.min} max={facets.max} step={1} value={maxP ?? facets.max} onChange={(e) => setMaxP(Number(e.target.value) >= facets.max ? null : Number(e.target.value))} /></>)}
      <button className="btn f-apply" onClick={() => setOpen(false)}>{shown.length} Artikel anzeigen</button>
    </aside>
  );
  const chips = [...fams.map((x) => ({ l: x, f: () => tog(setFams, x) })), ...sizes.map((x) => ({ l: `Größe ${x}`, f: () => tog(setSizes, x) })), ...genders.map((x) => ({ l: x, f: () => tog(setGenders, x) })), ...props.map((x) => ({ l: x, f: () => tog(setProps, x) })), ...brands.map((x) => ({ l: x, f: () => tog(setBrands, x) })), ...(maxP != null ? [{ l: `bis ${pr.p(maxP)}`, f: () => setMaxP(null) }] : [])];

  return (
    <div className="fg">
      <div className="fg-top">
        <button className="btn alt f-open" onClick={() => setOpen(true)}>Filter{active ? ` (${active})` : ''}</button>
        {panel}
        <label className="muted fg-sort">Sortieren
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="empfohlen">Empfohlen</option><option value="preis">Preis aufsteigend</option><option value="preis-ab">Preis absteigend</option><option value="name">Name A–Z</option>
          </select>
        </label>
      </div>
      <div className="fg-info">
        <span className="muted">{shown.length} Artikel</span>
        {chips.map((c) => <button key={c.l} className="f-chip" onClick={c.f}>{c.l} ×</button>)}
        {chips.length > 1 && <button className="linkbtn muted" onClick={reset}>Alle entfernen</button>}
      </div>
      {shown.length ? <div className="grid">{shown.slice(0, limit).map((p) => <ProductCard key={p.id} p={p} />)}</div>
        : <div className="box muted">Keine Artikel mit diesen Filtern. <button className="linkbtn" onClick={reset}>Filter zurücksetzen</button></div>}
      {shown.length > limit && (
        <div className="more">
          <div className="more-bar"><i style={{ width: `${(limit / shown.length) * 100}%` }} /></div>
          <span className="muted">{limit} von {shown.length} Artikeln</span>
          <div ref={more} aria-hidden style={{ height: 1 }} />
          <button className="btn alt" onClick={() => setLimit((l) => l + 24)}>Mehr laden</button>
        </div>
      )}
    </div>
  );
}
