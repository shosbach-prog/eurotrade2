'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { PublicProduct } from '@/lib/types';
import { eur } from '@/lib/format';
import ProductImage from './ProductImage';

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [items, setItems] = useState<PublicProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setItems([]); return; }
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const r = await fetch(`/api/search?limit=7&q=${encodeURIComponent(term)}`);
      const d = await r.json();
      if (id === reqId.current) { setItems(d.items); setTotal(d.total); setActive(-1); }
    }, 120);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const goSearch = () => { if (q.trim()) { setOpen(false); router.push(`/suche?q=${encodeURIComponent(q.trim())}`); } };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && items[active]) { setOpen(false); router.push(`/produkt/${encodeURIComponent(items[active].id)}`); }
      else goSearch();
    }
  };

  return (
    <div className="search" ref={box}>
      <input
        type="search" value={q} placeholder="Suche nach Artikel, Marke, Farbe, Artikelnr. …"
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
        aria-label="Produktsuche" autoComplete="off" spellCheck={false}
      />
      <button className="go" onClick={goSearch} aria-label="Suchen">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </button>
      {open && q.trim().length >= 2 && (
        <div className="sugg">
          {items.length === 0 ? <div className="empty">Keine Treffer für „{q}“</div> : items.map((p, i) => (
            <a key={p.id} href={`/produkt/${encodeURIComponent(p.id)}`} className={i === active ? 'on' : ''} onMouseEnter={() => setActive(i)}>
              <div className="thumb"><ProductImage p={p} /></div>
              <div><div className="t">{p.name}</div><div className="s">{p.brand} · {p.category} · {p.sku}</div></div>
              <div className="p">ab {eur(p.price)}</div>
            </a>
          ))}
          {total > items.length && <a className="all" href={`/suche?q=${encodeURIComponent(q.trim())}`}>Alle {total} Treffer anzeigen →</a>}
        </div>
      )}
    </div>
  );
}
