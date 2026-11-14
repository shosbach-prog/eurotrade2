import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { SUBTYPES, matchSub } from './menu-defs';
import { getCategories, visibleProducts } from './catalog';
import { ZIELGRUPPEN } from './zielgruppen';
import { AKTIONEN } from './aktionen';
import { GUIDES } from './ratgeber';
import { productPath, catPath } from './format';
import { listTeamShops } from './teamshop';
import { brandList } from './brand-catalog';

export type SitemapEntry = { path: string; title: string; group: string; priority: number; changefreq: 'weekly' | 'monthly' | 'yearly'; lastmod?: string; images?: { loc: string; title: string }[] };

/** Stand des Sortiments (letzter Sync) als Änderungsdatum für Kategorie- und Artikelseiten */
function catalogDate() {
  for (const f of [path.join(process.cwd(), 'data', 'products.json'), path.join(process.cwd(), 'seed', 'products.json')]) {
    try { return fs.statSync(f).mtime.toISOString().slice(0, 10); } catch { /* weiter */ }
  }
  return new Date().toISOString().slice(0, 10);
}

/** Alle öffentlichen Seiten – Grundlage für sitemap.xml und die Seitenübersicht */
export function sitemapEntries(): SitemapEntry[] {
  const d = catalogDate();
  const out: SitemapEntry[] = [
    { path: '/', title: 'Startseite', group: 'Allgemein', priority: 1, changefreq: 'weekly', lastmod: d },
    { path: '/druck-stick', title: 'Druck & Stick', group: 'Allgemein', priority: 0.8, changefreq: 'monthly' },
    { path: '/marken', title: 'Alle Marken', group: 'Allgemein', priority: 0.7, changefreq: 'weekly', lastmod: d },
    { path: '/ratgeber', title: 'Ratgeber', group: 'Allgemein', priority: 0.7, changefreq: 'monthly' },
    { path: '/kontakt', title: 'Kontakt & Anfrage', group: 'Allgemein', priority: 0.6, changefreq: 'yearly' },
    { path: '/ueber-uns', title: 'Über uns', group: 'Allgemein', priority: 0.5, changefreq: 'yearly' },
    { path: '/garantie', title: 'Zufriedenheitsgarantie', group: 'Rechtliches', priority: 0.4, changefreq: 'yearly' },
    { path: '/widerruf', title: 'Rückgabe & Widerruf', group: 'Rechtliches', priority: 0.3, changefreq: 'yearly' },
    { path: '/agb', title: 'AGB', group: 'Rechtliches', priority: 0.2, changefreq: 'yearly' },
    { path: '/impressum', title: 'Impressum', group: 'Rechtliches', priority: 0.1, changefreq: 'yearly' },
    ...ZIELGRUPPEN.map((z) => ({ path: `/fuer/${z.slug}`, title: `Für ${z.dativ}`, group: 'Zielgruppen & Aktionen', priority: 0.8, changefreq: 'monthly' as const })),
    ...AKTIONEN.map((a) => ({ path: `/aktion/${a.slug}`, title: a.nav, group: 'Zielgruppen & Aktionen', priority: 0.8, changefreq: 'weekly' as const })),
    ...GUIDES.map((g) => ({ path: `/ratgeber/${g.slug}`, title: g.title, group: 'Ratgeber', priority: 0.7, changefreq: 'monthly' as const })),
  ];
  const cats = getCategories();
  const all = visibleProducts();
  for (const c of cats) {
    out.push({ path: catPath(c.slug), title: c.name, group: 'Kategorien', priority: 0.8, changefreq: 'weekly', lastmod: d });
    const ps = all.filter((p) => p.categorySlug === c.slug);
    for (const x of SUBTYPES[c.slug as keyof typeof SUBTYPES] ?? []) {
      const n = ps.filter((p) => matchSub(x, p.name)).length;
      if (n >= 2 && n < ps.length) out.push({ path: catPath(x.key), title: x.label, group: 'Kategorien', priority: 0.7, changefreq: 'weekly', lastmod: d });
    }
    for (const g of ['Damen', 'Herren', 'Kinder']) {
      const n = ps.filter((p) => p.gender === g || (g !== 'Kinder' && (p.gender ?? 'Unisex') === 'Unisex')).length;
      if (n >= 3 && n < ps.length) out.push({ path: catPath(`${c.slug}-${g.toLowerCase()}`), title: `${c.name} für ${g}`, group: 'Kategorien', priority: 0.6, changefreq: 'weekly', lastmod: d });
    }
  }
  for (const b of brandList()) if (b.count > 0) out.push({ path: `/marken/${b.slug}`, title: b.name, group: 'Marken', priority: 0.6, changefreq: 'weekly', lastmod: d });
  for (const t of listTeamShops()) if (t.active && t.indexed) out.push({ path: `/team/${t.slug}`, title: t.name, group: 'Motiv- & Team-Shops', priority: 0.7, changefreq: 'weekly', lastmod: d });
  for (const p of all) out.push({ path: productPath(p), title: p.model ? `${p.name} – ${p.model}` : p.name, group: `Artikel: ${p.category}`, priority: 0.6, changefreq: 'weekly', lastmod: d,
    images: p.images.slice(0, 3).map((u) => ({ loc: u, title: `${p.name} – ${p.brand}` })) });
  // doppelte Pfade (z. B. Unterkategorie = Kategorie) nur einmal
  const seen = new Set<string>();
  return out.filter((e) => (seen.has(e.path) ? false : (seen.add(e.path), true)));
}
