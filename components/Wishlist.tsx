'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Ctx = { ids: string[]; has: (id: string) => boolean; toggle: (id: string) => void; clear: () => void; addAll: (ids: string[]) => void };
const WishCtx = createContext<Ctx | null>(null);
const KEY = 'et-merkliste-v1';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { try { setIds(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {} }, []);
  const save = (next: string[]) => { setIds(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {} };
  const has = (id: string) => ids.includes(id);
  const toggle = (id: string) => save(has(id) ? ids.filter((x) => x !== id) : [id, ...ids]);
  const addAll = (more: string[]) => save([...ids, ...more.filter((x) => !ids.includes(x))]);
  return <WishCtx.Provider value={{ ids, has, toggle, clear: () => save([]), addAll }}>{children}</WishCtx.Provider>;
}
export const useWishlist = () => useContext(WishCtx)!;

const Heart = ({ filled, size = 20 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
  </svg>
);

/** Herz-Button – auf Karten (variant="card") oder auf der Produktseite (variant="full") */
export function WishButton({ id, variant = 'card' }: { id: string; variant?: 'card' | 'full' }) {
  const { has, toggle } = useWishlist();
  const on = has(id);
  const click = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); toggle(id); };
  if (variant === 'full') return (
    <button type="button" className={`btn alt wish-full ${on ? 'on' : ''}`} onClick={click} aria-pressed={on}>
      <Heart filled={on} /> {on ? 'Gemerkt' : 'Merken'}
    </button>
  );
  return (
    <button type="button" className={`wish ${on ? 'on' : ''}`} onClick={click} aria-pressed={on} aria-label={on ? 'Von Merkliste entfernen' : 'Auf die Merkliste'} title={on ? 'Von Merkliste entfernen' : 'Merken'}>
      <Heart filled={on} size={18} />
    </button>
  );
}

export function WishlistButton() {
  const { ids } = useWishlist();
  return (
    <a href="/merkliste" className="cart-btn" aria-label="Merkliste">
      <Heart filled={ids.length > 0} size={22} />
      <span className="hide-sm">Merkliste</span>
      {ids.length > 0 && <span className="badge">{ids.length}</span>}
    </a>
  );
}
