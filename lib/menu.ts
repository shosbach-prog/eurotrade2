import 'server-only';
import { dealCount, getCategories, visibleProducts, type Ctx } from './catalog';
import { brandList } from './brand-catalog';
import { ZIELGRUPPEN } from './zielgruppen';
import { AKTIONEN } from './aktionen';
import { GENDERS, GROUPS, SUBTYPES, matchSub, type Menu, type MenuCat } from './menu-defs';

/** Daten für das Mega-Menü (nur Kategorien/Typen mit Artikeln) */
export function menuData(ctx?: Ctx): Menu {
  const ps = visibleProducts(ctx);
  const cats = getCategories(ctx);
  const mc = new Map<string, MenuCat>();
  for (const c of cats) {
    const items = ps.filter((p) => p.categorySlug === c.slug);
    if (!items.length) continue;
    const subs = (SUBTYPES[c.slug] ?? []).map((s) => ({ key: s.key, label: s.label, count: items.filter((p) => matchSub(s, p.name)).length })).filter((s) => s.count >= 2 && s.count < items.length);
    const g: Record<string, number> = {};
    for (const p of items) { const k = p.gender ?? 'Unisex'; g[k] = (g[k] ?? 0) + 1; }
    mc.set(c.slug, { slug: c.slug, name: c.name, count: items.length, subs, g });
  }
  const used = new Set<string>();
  const groups = GROUPS.map((gr) => { const list = gr.cats.map((s) => mc.get(s)).filter((x): x is MenuCat => !!x); list.forEach((c) => used.add(c.slug)); return { key: gr.key, label: gr.label, cats: list }; });
  const rest = [...mc.values()].filter((c) => !used.has(c.slug));
  if (rest.length) groups[groups.length - 1].cats.push(...rest);
  const genders = GENDERS.map((label) => {
    const list = [...mc.values()].map((c) => ({ slug: c.slug, name: c.name, count: (c.g[label] ?? 0) + (label !== 'Kinder' ? c.g.Unisex ?? 0 : 0) })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
    return { label, cats: list, total: ps.filter((p) => p.gender === label || (label !== 'Kinder' && (p.gender ?? 'Unisex') === 'Unisex')).length };
  }).filter((g) => g.cats.length);
  const brands = brandList(ctx).filter((b) => b.count > 0).sort((a, b) => b.count - a.count).slice(0, 10).map((b) => ({ slug: b.slug, name: b.name, count: b.count }));
  const branchen = [...ZIELGRUPPEN.map((z) => ({ href: `/fuer/${z.slug}`, label: z.nav })), ...AKTIONEN.map((a) => ({ href: `/aktion/${a.slug}`, label: a.nav }))];
  return { groups: groups.filter((g) => g.cats.length), genders, brands, branchen, deals: dealCount(ctx) };
}
