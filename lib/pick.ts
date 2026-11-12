import 'server-only';
import { allPublic, eolCount, saleCount } from './catalog';
import { SUBTYPES, matchSub } from './menu-defs';
import { AKTIONEN } from './aktionen';
import { ZIELGRUPPEN } from './zielgruppen';
import type { PickItem, PickGroup } from '@/components/ArticlePicker';

/** Daten für die Admin-Artikelauswahl: Artikel + Filtergruppen wie im Mega-Menü (Unterkategorien, Anlässe, Branchen, Angebote) */
export function pickData(): { items: PickItem[]; groups: PickGroup[] } {
  const ps = allPublic(null);
  const items: PickItem[] = ps.map((p) => {
    const tags: string[] = [];
    for (const s of SUBTYPES[p.categorySlug] ?? []) if (matchSub(s, p.name)) tags.push(`sub:${s.key}`);
    for (const a of AKTIONEN) if (a.groups ? a.groups.some((g) => g.pick(p)) : a.pick(p) > 0) tags.push(`akt:${a.slug}`);
    for (const z of ZIELGRUPPEN) if (z.cats.includes(p.categorySlug)) tags.push(`fuer:${z.slug}`);
    if (p.eol) tags.push('eol');
    if (p.sale) tags.push('sale');
    return { id: p.id, sku: p.sku, name: p.name, brand: p.brand, category: p.category, categorySlug: p.categorySlug, gender: p.gender ?? 'Unisex', image: p.images[0] ?? p.colors.find((c) => c.image)?.image ?? null, colors: p.colors.length, tags };
  });
  const count = (t: string) => items.filter((i) => i.tags?.includes(t)).length;
  const subs = Object.entries(SUBTYPES).flatMap(([cat, list]) => list.map((s) => ({ key: `sub:${s.key}`, label: s.title ?? s.label, cat, count: count(`sub:${s.key}`) }))).filter((x) => x.count > 0);
  const groups: PickGroup[] = [
    { title: 'Anlässe', entries: AKTIONEN.map((a) => ({ key: `akt:${a.slug}`, label: a.nav, count: count(`akt:${a.slug}`) })).filter((x) => x.count) },
    { title: 'Branchen', entries: ZIELGRUPPEN.map((z) => ({ key: `fuer:${z.slug}`, label: z.nav, count: count(`fuer:${z.slug}`) })).filter((x) => x.count) },
    { title: 'Angebote', entries: [{ key: 'sale', label: 'Sonderangebote', count: saleCount() }, { key: 'eol', label: 'Auslaufartikel', count: eolCount() }].filter((x) => x.count) },
    { title: '_sub', entries: subs },
  ];
  return { items, groups };
}
