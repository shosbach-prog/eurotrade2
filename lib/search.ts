import MiniSearch, { type Query } from 'minisearch';
import type { Product } from './types';

/** Kleinschreibung, Umlaute vereinheitlichen, Akzente entfernen */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Wörter + zusammengezogene Nachbarwörter ("T-Shirt" -> t, shirt, tshirt) */
function tokenize(text: string): string[] {
  const words = normalize(text).split(/[^a-z0-9]+/).filter(Boolean);
  const out = [...words];
  for (let i = 0; i < words.length - 1; i++) out.push(words[i] + words[i + 1]);
  return out;
}

/** Umgangssprache & Branchenbegriffe -> Suchbegriffe im Katalog */
const SYNONYMS: Record<string, string[]> = {
  shirt: ['tshirt'], tshirt: ['shirt'], tee: ['tshirt'], tshirts: ['tshirt'],
  pulli: ['pullover', 'sweatshirt'], pullover: ['sweatshirt'], sweater: ['sweatshirt', 'pullover'],
  hoodie: ['kapuzenpullover', 'kapuze'], hoody: ['hoodie'], kapuzenpulli: ['hoodie'],
  polo: ['poloshirt'], polohemd: ['poloshirt'],
  jacke: ['jacket'], jacket: ['jacke'], weste: ['vest'],
  hose: ['pants', 'jogginghose'], jogger: ['jogginghose'],
  muetze: ['beanie', 'cap'], kappe: ['cap'], basecap: ['cap'], beanie: ['muetze'],
  tasche: ['bag', 'beutel'], beutel: ['tasche', 'bag'], jutebeutel: ['baumwolltasche', 'tasche'],
  handtuch: ['towel'], schuerze: ['apron'],
  damen: ['women', 'lady', 'ladies'], frauen: ['damen'], herren: ['men', 'mens'], maenner: ['herren'],
  kinder: ['kids', 'kid'], kids: ['kinder'],
  bio: ['organic'], organic: ['bio'], schwarz: ['black'], weiss: ['white'], blau: ['blue', 'navy'],
  rot: ['red'], gruen: ['green'], grau: ['grey', 'gray'],
};

export type SearchDoc = Product & { colorNames: string };

export function buildSkuMap(products: Product[]) {
  return new Map(products.map((p) => [compact(p.sku), p.id]));
}

export function buildIndex(products: Product[]) {
  const ms = new MiniSearch<SearchDoc>({
    idField: 'id',
    fields: ['name', 'brand', 'category', 'sku', 'tags', 'description', 'colorNames', 'material', 'gender'],
    storeFields: ['id'],
    tokenize,
    processTerm: (t) => t || null,
    extractField: (doc, field) => {
      const v = (doc as any)[field];
      return Array.isArray(v) ? v.join(' ') : v ?? '';
    },
    searchOptions: {
      boost: { name: 5, sku: 4, brand: 3, category: 3, tags: 2, colorNames: 1.2, gender: 1.5, description: 0.4 },
      prefix: (t) => t.length >= 2,
      fuzzy: (t) => (t.length <= 3 || /\d/.test(t) ? false : t.length <= 5 ? 1 : 2),
      weights: { fuzzy: 0.45, prefix: 0.8 },
    },
  });
  ms.addAll(products.map((p) => ({ ...p, colorNames: p.colors.map((c) => c.name).join(' ') })));
  return ms;
}

function queryTree(q: string, combineWith: 'AND' | 'OR'): Query {
  const words = normalize(q).split(/[^a-z0-9]+/).filter(Boolean);
  // "t shirt" eingegeben -> zusätzlich "tshirt"
  const joined = words.length > 1 ? [words.join('')] : [];
  return {
    combineWith,
    queries: words.map((w) => ({
      combineWith: 'OR' as const,
      queries: [w, ...(SYNONYMS[w] ?? []), ...joined],
    })),
  } as Query;
}

const compact = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');

export function runSearch(ms: MiniSearch<SearchDoc>, q: string, limit = 48, skuMap?: Map<string, string>): string[] {
  const query = q.trim();
  if (!query) return [];
  // Artikelnummer exakt eingegeben -> direkt dieser Artikel
  const exact = skuMap?.get(compact(query));
  if (exact) return [exact];
  let res = ms.search(queryTree(query, 'AND'));
  if (res.length === 0) res = ms.search(queryTree(query, 'OR')); // Fallback: irgendein Treffer
  return res.slice(0, limit).map((r) => String(r.id));
}
