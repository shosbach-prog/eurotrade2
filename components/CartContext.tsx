'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Deco } from '@/lib/deco';

export type CartLine = { key: string; id: string; sku: string; name: string; color?: string; size?: string; qty: number; price: number | null; hex?: string; category: string; image?: string; deco?: Deco | null; tiers?: { min: number; price: number }[] };
type Ctx = { lines: CartLine[]; add: (l: Omit<CartLine, 'key'>) => void; addMany: (ls: Omit<CartLine, 'key'>[]) => void; setQty: (key: string, qty: number) => void; remove: (key: string) => void; clear: () => void; count: number };

const CartCtx = createContext<Ctx | null>(null);
const KEY = 'et-cart-v2'; // v1 enthielt Demo-Artikel

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => { try { setLines(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {} }, []);
  const save = (next: CartLine[]) => { setLines(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {} };

  const merge = (base: CartLine[], l: Omit<CartLine, 'key'>) => {
    const key = `${l.id}|${l.color ?? ''}|${l.size ?? ''}|${l.deco ? JSON.stringify(l.deco) : ''}`;
    const ex = base.find((x) => x.key === key);
    return ex ? base.map((x) => (x.key === key ? { ...x, qty: x.qty + l.qty } : x)) : [...base, { ...l, key }];
  };
  const add: Ctx['add'] = (l) => save(merge(lines, l));
  const addMany: Ctx['addMany'] = (ls) => save(ls.reduce(merge, lines));
  const setQty = (key: string, qty: number) => save(lines.map((x) => (x.key === key ? { ...x, qty: Math.max(1, qty) } : x)));
  const remove = (key: string) => save(lines.filter((x) => x.key !== key));
  const clear = () => save([]);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return <CartCtx.Provider value={{ lines, add, addMany, setQty, remove, clear, count }}>{children}</CartCtx.Provider>;
}
export const useCart = () => useContext(CartCtx)!;

export function CartButton() {
  const { count } = useCart();
  return (
    <a href="/warenkorb" className="cart-btn" aria-label="Warenkorb">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.7a2 2 0 0 0 2-1.6L21 7H6" /><circle cx="9" cy="21" r="1" /><circle cx="18" cy="21" r="1" /></svg>
      <span className="hide-sm">Warenkorb</span>
      {count > 0 && <span className="badge">{count}</span>}
    </a>
  );
}
