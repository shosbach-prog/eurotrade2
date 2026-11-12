'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { adaptDeco, type Deco } from '@/lib/deco';
import CartDrawer from './CartDrawer';

export type CartLine = {
  key: string; id: string; sku: string; name: string; color?: string; size?: string; qty: number; price: number | null;
  hex?: string; category: string; image?: string; deco?: Deco | null; tiers?: { min: number; price: number }[];
  /** verfügbare Größen – für die Bearbeitung im Warenkorb */
  sizes?: string[];
  /** Musterteil (1 Stück, wird angerechnet) */
  sample?: boolean;
  /** Bestellung über einen Team-Shop */
  team?: string;
};
type NewLine = Omit<CartLine, 'key'>;
type Ctx = {
  lines: CartLine[]; count: number;
  add: (l: NewLine) => void; addMany: (ls: NewLine[], opt?: { replace?: boolean; quiet?: boolean }) => void;
  setQty: (key: string, qty: number) => void; update: (key: string, patch: Partial<NewLine>) => void;
  remove: (key: string) => void; clear: () => void; decoToAll: (deco: Deco | null) => void;
  drawer: boolean; openDrawer: () => void; closeDrawer: () => void; lastAdded: string[];
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = 'et-cart-v2';
const keyOf = (l: NewLine) => `${l.id}|${l.color ?? ''}|${l.size ?? ''}|${l.deco ? JSON.stringify(l.deco) : ''}${l.sample ? '|muster' : ''}${l.team ? `|t:${l.team}` : ''}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [lastAdded, setLastAdded] = useState<string[]>([]);
  useEffect(() => { try { setLines(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {} }, []);
  const save = (next: CartLine[]) => { setLines(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {} };

  /** gleiche Position (Artikel, Farbe, Größe, Veredelung) wird zusammengefasst */
  const merge = (base: CartLine[], l: NewLine) => {
    const key = keyOf(l);
    const ex = base.find((x) => x.key === key);
    return ex ? base.map((x) => (x.key === key ? { ...x, qty: l.sample ? 1 : x.qty + l.qty } : x)) : [...base, { ...l, key }];
  };
  const addMany: Ctx['addMany'] = (ls, opt) => { save(ls.reduce(merge, opt?.replace ? [] : lines)); setLastAdded(ls.map(keyOf)); if (!opt?.quiet) setDrawer(true); };
  const add: Ctx['add'] = (l) => addMany([l]);
  const setQty = (key: string, qty: number) => save(lines.map((x) => (x.key === key ? { ...x, qty: x.sample ? 1 : Math.max(1, Math.floor(qty) || 1) } : x)));
  const update: Ctx['update'] = (key, patch) => {
    const cur = lines.find((x) => x.key === key);
    if (!cur) return;
    const { key: _k, ...rest } = cur;
    save(merge(lines.filter((x) => x.key !== key), { ...rest, ...patch }));
  };
  const decoToAll = (deco: Deco | null) => save(lines.reduce<CartLine[]>((acc, { key: _k, ...l }) => merge(acc, l.sample ? l : { ...l, deco: deco ? { ...adaptDeco(deco, l)!, team: l.deco?.team ?? null, previews: l.deco?.previews } : null }), []));
  const remove = (key: string) => save(lines.filter((x) => x.key !== key));
  const clear = () => save([]);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return (
    <CartCtx.Provider value={{ lines, count, add, addMany, setQty, update, remove, clear, decoToAll, drawer, openDrawer: () => setDrawer(true), closeDrawer: () => setDrawer(false), lastAdded }}>
      {children}
      <CartDrawer />
    </CartCtx.Provider>
  );
}
export const useCart = () => useContext(CartCtx)!;

export function CartButton() {
  const { count, openDrawer } = useCart();
  return (
    <a href="/warenkorb" className="cart-btn" aria-label="Warenkorb" onClick={(e) => { if (count > 0 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); openDrawer(); } }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.7a2 2 0 0 0 2-1.6L21 7H6" /><circle cx="9" cy="21" r="1" /><circle cx="18" cy="21" r="1" /></svg>
      <span className="hide-sm hide-lg">Warenkorb</span>
      {count > 0 && <span className="badge">{count}</span>}
    </a>
  );
}
