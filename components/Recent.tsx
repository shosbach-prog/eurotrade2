'use client';
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import type { PublicProduct } from '@/lib/types';

const KEY = 'et-recent-v1';
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };

/** merkt sich den aufgerufenen Artikel */
export function RecentTracker({ id }: { id: string }) {
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify([id, ...read().filter((x) => x !== id)].slice(0, 16))); } catch {} }, [id]);
  return null;
}

/** „Zuletzt angesehen“ – ohne aktuellen Artikel */
export function RecentlyViewed({ exclude, title = 'Zuletzt angesehen' }: { exclude?: string; title?: string }) {
  const [items, setItems] = useState<PublicProduct[]>([]);
  useEffect(() => {
    const ids = read().filter((x) => x !== exclude).slice(0, 8);
    if (!ids.length) return;
    fetch(`/api/produkte?ids=${encodeURIComponent(ids.join(','))}`).then((r) => r.json()).then(setItems).catch(() => {});
  }, [exclude]);
  if (!items.length) return null;
  return <><h2>{title}</h2><div className="grid recent">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div></>;
}
