import 'server-only';
import type { PublicProduct } from './types';
import type { HeroItem } from '@/components/HeroProducts';
import { eur } from './format';

/** Artikel für die Hero-Bühne: nur mit Bild, Top-Artikel zuerst */
export function heroItems(list: PublicProduct[], opts: { link: boolean; n?: number }): HeroItem[] {
  return list.filter((p) => p.images[0]).slice(0, opts.n ?? 6).map((p) => {
    const from = p.tiers.length ? Math.min(p.price ?? Infinity, ...p.tiers.map((t) => t.price)) : p.price;
    return {
      id: p.id, name: p.name, brand: p.brand, image: p.images[0],
      colors: p.colors.map((c) => c.hex).filter((h): h is string => !!h).slice(0, 6), colorCount: p.colors.length,
      label: p.locked ? '🔒 Preis nach Anmeldung' : from != null && Number.isFinite(from) ? `ab ${eur(from)}` : 'Preis auf Anfrage',
      href: opts.link ? `/produkt/${p.id}` : '#preis',
    };
  });
}
