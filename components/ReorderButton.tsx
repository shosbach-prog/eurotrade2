'use client';
import { useState } from 'react';
import { useCart } from './CartContext';
import type { PublicProduct } from '@/lib/types';
import type { Deco } from '@/lib/deco';

export type ReLine = { id?: string; color: string; size: string; qty: number; deco: Deco | null; sample?: boolean };

/** Gleiche Bestellung nochmal: Artikel, Farben, Größen, Mengen und Veredelung zurück in den Warenkorb */
export default function ReorderButton({ lines, no, className = 'btn alt', label = '↻ Nochmal bestellen' }: { lines: ReLine[]; no: string; className?: string; label?: string }) {
  const { addMany, openDrawer } = useCart();
  const [msg, setMsg] = useState('');
  async function go() {
    const ls = lines.filter((l) => !l.sample);
    const ids = [...new Set(ls.map((l) => l.id).filter(Boolean))] as string[];
    const prods: PublicProduct[] = await fetch(`/api/produkte?ids=${encodeURIComponent(ids.join(','))}`).then((x) => x.json()).catch(() => []);
    const items = ls.flatMap((l) => {
      const p = prods.find((x) => x.id === l.id);
      if (!p) return [];
      const col = p.colors.find((c) => c.name === l.color);
      return [{ id: p.id, sku: p.sku, name: p.name, color: l.color || undefined, hex: col?.hex, size: l.size || undefined, qty: l.qty, price: p.price, category: p.category, image: col?.image ?? p.images[0], deco: l.deco, tiers: p.tiers, sizes: p.sizes }];
    });
    if (!items.length) { setMsg('Die Artikel sind leider nicht mehr verfügbar.'); return; }
    addMany(items); openDrawer();
    setMsg(items.length < ls.length ? 'Einige Artikel sind nicht mehr verfügbar und wurden übersprungen.' : `✓ ${items.reduce((s, x) => s + x.qty, 0)} Stück aus ${no} im Warenkorb – Mengen und Namen können Sie dort anpassen.`);
  }
  return <>{<button type="button" className={className} onClick={go}>{label}</button>}{msg && <span className="note" style={{ display: 'block', marginTop: 8 }}>{msg}</span>}</>;
}
