import 'server-only';
import { BRANDS, brandSlug, findBrand, type Brand } from './brands';
import { brandCounts, getByBrand, type Ctx } from './catalog';

export type BrandInfo = Brand & { slug: string; count: number; extra?: boolean };

/** Alle Hersteller (mit Logo) + Herstellernamen aus dem Katalog ohne Logo */
export function brandList(ctx?: Ctx): BrandInfo[] {
  const counts = brandCounts(ctx);
  const byBrand = new Map<string, number>();
  const extra: BrandInfo[] = [];
  for (const [name, n] of counts) {
    const b = findBrand(name);
    if (b) byBrand.set(b.name, (byBrand.get(b.name) ?? 0) + n);
    else extra.push({ name, logo: '', slug: brandSlug({ name, logo: '' }), count: n, extra: true });
  }
  return [...BRANDS.filter((b) => !b.service).map((b) => ({ ...b, slug: brandSlug(b), count: byBrand.get(b.name) ?? 0 })), ...extra]
    .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
}
export const brandBySlug = (slug: string, ctx?: Ctx) => brandList(ctx).find((b) => b.slug === slug) ?? null;
export const productsOfBrand = (b: BrandInfo, ctx?: Ctx) => getByBrand((name) => (b.extra ? name === b.name : findBrand(name)?.name === b.name), ctx);
