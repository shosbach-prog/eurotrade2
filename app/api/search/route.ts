import { NextResponse } from 'next/server';
import { didYouMean, getCategories, search } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';
import { brandList } from '@/lib/brand-catalog';

export const dynamic = 'force-dynamic';
/** Umgangssprache → Kategorie */
const SYN: [RegExp, string][] = [
  [/^(hood|kapuz|sweat|pulli|pullover|zipper|crewneck)/, 'sweatshirts'], [/^(tshirt|t-shirt|shirt|tee|tshi|longsleeve)/, 't-shirts'], [/^polo/, 'poloshirts'],
  [/^(jack|softshell|fleece|weste|parka|bodywarmer|regenjacke)/, 'jacken'], [/^(hose|jogger|jogging|short)/, 'hosen'], [/^(cap|muetze|mutze|beanie|basecap|kappe)/, 'caps-muetzen'],
  [/^(hemd|bluse)/, 'hemden-blusen'], [/^kleid/, 'kleider'], [/^(tasche|bag|beutel|rucksack|schal|handtuch)/, 'accessoires'], [/^(decke|blanket)/, 'decken'], [/^(arbeit|workwear)/, 'arbeitskleidung'],
];
const norm = (s: string) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') ?? '').slice(0, 100);
  const limit = Math.min(Number(u.searchParams.get('limit') ?? 8), 50);
  const ctx = await getCustomer();
  const all = search(q, 200, ctx);
  const n = norm(q);
  // Kategorien und Marken als eigene Vorschlagsgruppen
  const syn = new Set(SYN.filter(([re]) => re.test(n)).map(([, slug]) => slug));
  const cats = n.length >= 2 ? getCategories(ctx).filter((c) => syn.has(c.slug) || norm(c.name).includes(n) || n.includes(norm(c.name).slice(0, 5))).slice(0, 3).map((c) => ({ name: c.name, slug: c.slug, count: c.count })) : [];
  const brands = n.length >= 2 ? brandList(ctx).filter((b) => b.count > 0 && (norm(b.name).includes(n) || (n.length >= 3 && norm(b.name).startsWith(n.slice(0, 3))))).slice(0, 3).map((b) => ({ name: b.name, slug: b.slug, logo: b.logo, count: b.count })) : [];
  // schlanke Treffer – nur was die Vorschlagsliste braucht
  const items = all.slice(0, limit).map((p) => ({ id: p.id, name: p.name, brand: p.brand, category: p.category, sku: p.sku, price: p.price, images: p.images.slice(0, 1), colors: p.colors.slice(0, 1).map((c) => ({ name: c.name, hex: c.hex })) }));
  return NextResponse.json({ total: all.length, items, cats, brands, suggest: all.length ? null : didYouMean(q, ctx) }, { headers: { 'Cache-Control': 'private, max-age=60' } });
}
