import { SUBTYPES, matchSub } from '@/lib/menu-defs';
import type { MetadataRoute } from 'next';
import { previewMode } from '@/lib/access';
import { getCategories, allProductsBrief, visibleProducts } from '@/lib/catalog';
import { ZIELGRUPPEN } from '@/lib/zielgruppen';
import { AKTIONEN } from '@/lib/aktionen';
import { GUIDES } from '@/lib/ratgeber';
import { productPath } from '@/lib/format';

export const dynamic = 'force-dynamic';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1, changeFrequency: 'weekly', lastModified: now },
    { url: `${base}/druck-stick`, priority: 0.8, changeFrequency: 'monthly', lastModified: now },
    ...ZIELGRUPPEN.map((z) => ({ url: `${base}/fuer/${z.slug}`, priority: 0.8, changeFrequency: 'monthly' as const, lastModified: now })),
    ...AKTIONEN.map((a) => ({ url: `${base}/aktion/${a.slug}`, priority: 0.8, changeFrequency: 'weekly' as const, lastModified: now })),
    { url: `${base}/ratgeber`, priority: 0.7, changeFrequency: 'monthly', lastModified: now },
    ...GUIDES.map((g) => ({ url: `${base}/ratgeber/${g.slug}`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: now })),
    { url: `${base}/kontakt`, priority: 0.6, changeFrequency: 'yearly', lastModified: now },
    { url: `${base}/agb`, priority: 0.2, changeFrequency: 'yearly', lastModified: now },
    { url: `${base}/ueber-uns`, priority: 0.5, changeFrequency: 'yearly', lastModified: now },
    { url: `${base}/garantie`, priority: 0.4, changeFrequency: 'yearly', lastModified: now },
    { url: `${base}/widerruf`, priority: 0.3, changeFrequency: 'yearly', lastModified: now },
    { url: `${base}/impressum`, priority: 0.1, changeFrequency: 'yearly', lastModified: now },
  ];
  if (previewMode()) return pages;
  // Schaufenster: Kategorien und Artikel (ohne Preise) – erst nach Freischaltung
  return [
    ...pages,
    ...getCategories().map((c) => ({ url: `${base}/kategorie/${c.slug}`, priority: 0.8, changeFrequency: 'weekly' as const, lastModified: now })),
    ...Object.entries(SUBTYPES).flatMap(([cat, list]) => { const ps = visibleProducts().filter((p) => p.categorySlug === cat); return list.filter((x) => { const n = ps.filter((p) => matchSub(x, p.name)).length; return n >= 2 && n < ps.length; }).map((x) => ({ url: `${base}/kategorie/${x.key}`, priority: 0.7, changeFrequency: 'weekly' as const, lastModified: now })); }),
    ...getCategories().flatMap((c) => { const ps = visibleProducts().filter((p) => p.categorySlug === c.slug); return ['Damen', 'Herren', 'Kinder'].filter((g) => { const n = ps.filter((p) => p.gender === g || (g !== 'Kinder' && (p.gender ?? 'Unisex') === 'Unisex')).length; return n >= 3 && n < ps.length; }).map((g) => ({ url: `${base}/kategorie/${c.slug}-${g.toLowerCase()}`, priority: 0.6, changeFrequency: 'weekly' as const, lastModified: now })); }),
    ...allProductsBrief().map((p) => ({ url: `${base}${productPath(p)}`, priority: 0.6, changeFrequency: 'weekly' as const, lastModified: now })),
  ];
}
