'use client';
import { useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import type { PublicProduct } from '@/lib/types';
import { FAMILY_HEX, colorFamily } from '@/lib/colors';
import { eur } from '@/lib/format';

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];
const sizeRank = (s: string) => { const i = SIZE_ORDER.indexOf(s); return i >= 0 ? i : 100 + (parseFloat(s) || 0); };
const minPrice = (p: PublicProduct) => (p.price == null ? null : p.tiers.length ? p.tiers[p.tiers.length - 1].price : p.price);

type Sort = 'empfohlen' | 'preis' | 'preis-ab' | 'name';

/** Produktliste mit Filtern: Marke, Farbe, Größe, Schnitt, Preis + Sortierung */
export default function FilterGrid({ items }: { items: PublicProduct[] }) {
  const [brands, setBrands] = useState<string[]>([]);
  const [fams, setFams] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [maxP, setMaxP] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>('empfohlen');
  const [open, setOpen] = useState(false);

  const facets = useMemo(() => {
    const count = (vals: string[][]) => { const m = new Map<string, number>(); vals.forEach((v) => new Set(v).forEach((x) => m.set(x, (m.get(x) ?? 0) + 1))); return m; };
    const prices = items.map(minPrice).filter((x): x is number => x != null);
    return {
      brand: [...count(items.map((p) => [p.brand])).entries()].sort((a, b) => a[0].localeCompare(b[0])),
      fam: [...count(items.map((p) => p.colors.map(colorFamily))).entries()].sort((a, b) => Object.keys(FAMILY_HEX).indexOf(a[0]) - Object.keys(FAMILY_HEX).indexOf(b[0])),
      size: [...count(items.map((p) => p.sizes)).entries()].filter(([s]) => s.length <= 6).sort((a, b) => sizeRank(a[0]) - sizeRank(b[0])),
      gender: [...count(items.map((p) => [p.gender ?? 'Unisex'])).entries()],
      max: prices.length ? Math.ceil(Math.max(...prices)) : 0, min: prices.length ? Math.floor(Math.min(...prices)) : 0,
    };
  }, [items]);

  const shown = useMemo(() => {
    let r = items.filter((p) =>
      (!brands.length || brands.includes(p.brand)) &&
      (!fams.length || p.colors.some((c) => fams.includes(colorFamily(c)))) &&
      (!sizes.length || sizes.some((s) => p.sizes.includes(s))) &&
      (!genders.length || genders.includes(p.gender ?? 'Unisex')) &&
      (maxP == null || (minPrice(p) ?? 0) <= maxP));
    if (sort === 'preis') r = [...r].sort((a, b) => (minPrice(a) ?? 1e9) - (minPrice(b) ?? 1e9));
    if (sort === 'preis-ab') r = [...r].sort((a, b) => (minPrice(b) ?? -1) - (minPrice(a) ?? -1));
    if (sort === 'name') r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [items, brands, fams, sizes, genders, maxP, sort]);

  const tog = (set: (f: (x: string[]) => string[]) => void, v: string) => set((x) => (x.includes(v) ? x.filter((y) => y !== v) : [...x, v]));
  const active = brands.length + fams.length + sizes.length + genders.length + (maxP != null ? 1 : 0);
  const reset = () => { setBrands([]); setFams([]); setSizes([]); setGenders([]); setMaxP(null); };

  const panel = (
    <aside className={`filters ${open ? 'open' : ''}`}>
      <div className="f-head"><strong>Filter</strong>{active > 0 && <button className="linkbtn" onClick={reset}>zurücksetzen</button>}<button className="x f-close" onClick={() => setOpen(false)} aria-label="Filter schließen">×</button></div>
      {facets.fam.length > 1 && <div className="f-group"><b>Farbe</b><div className="f-fams">{facets.fam.map(([f, n]) => (
        <button key={f} className={`f-fam ${fams.includes(f) ? 'on' : ''}`} onClick={() => tog(setFams, f)} title={`${f} (${n})`}><span style={{ background: FAMILY_HEX[f] }} />{f}</button>))}</div></div>}
      {facets.size.length > 1 && <div className="f-group"><b>Größe</b><div className="f-sizes">{facets.size.map(([s]) => <button key={s} className={`size ${sizes.includes(s) ? 'on' : ''}`} onClick={() => tog(setSizes, s)}>{s}</button>)}</div></div>}
      {facets.gender.length > 1 && <div className="f-group"><b>Schnitt</b>{facets.gender.map(([g, n]) => <label key={g} className="f-check"><input type="checkbox" checked={genders.includes(g)} onChange={() => tog(setGenders, g)} />{g}<span>{n}</span></label>)}</div>}
      {facets.brand.length > 1 && <div className="f-group"><b>Marke</b>{facets.brand.map(([b, n]) => <label key={b} className="f-check"><input type="checkbox" checked={brands.includes(b)} onChange={() => tog(setBrands, b)} />{b}<span>{n}</span></label>)}</div>}
      {facets.max > facets.min && <div className="f-group"><b>Preis bis {eur(maxP ?? facets.max)}</b><input type="range" min={facets.min} max={facets.max} step={1} value={maxP ?? facets.max} onChange={(e) => setMaxP(Number(e.target.value) >= facets.max ? null : Number(e.target.value))} /></div>}
      <button className="btn f-apply" onClick={() => setOpen(false)}>{shown.length} Artikel anzeigen</button>
    </aside>
  );

  return (
    <div className="fg">
      {panel}
      <div style={{ minWidth: 0 }}>
        <div className="fg-bar">
          <button className="btn alt f-open" onClick={() => setOpen(true)}>Filter{active ? ` (${active})` : ''}</button>
          <span className="muted">{shown.length} Artikel</span>
          <label className="muted fg-sort">Sortieren
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="empfohlen">Empfohlen</option><option value="preis">Preis aufsteigend</option><option value="preis-ab">Preis absteigend</option><option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
        {shown.length ? <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          : <div className="box muted">Keine Artikel mit diesen Filtern. <button className="linkbtn" onClick={reset}>Filter zurücksetzen</button></div>}
      </div>
    </div>
  );
}
