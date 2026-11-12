import { allPublic } from '@/lib/catalog';
import { getText } from '@/lib/content';
import { productPath } from '@/lib/format';
import { previewMode } from '@/lib/access';

export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n: number) => `${n.toFixed(2)} EUR`;

/** Produkt-Feed für das Google Merchant Center (nur Artikel mit Preis, Preise inkl. MwSt.) */
export async function GET() {
  if (previewMode()) return new Response('Feed erst nach Freischaltung des Shops verfügbar.', { status: 404 });
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  const abs = (u: string) => (u.startsWith('http') ? u : `${base}${u}`);
  const items = allPublic(null).filter((p) => p.price != null && p.priceGross != null && p.images.length);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>euro-trade.com – Markentextilien mit Logo</title>
<link>${base}</link>
<description>Textilien, Taschen und Werbemittel – ab 1 Stück, auf Wunsch bedruckt oder bestickt.</description>
${items.map((p) => {
  const t = getText(p).text;
  const desc = `${t.intro.split('\n\n')[0]} ${t.highlights.join(' · ')}`.slice(0, 4900);
  const sale = p.was != null;
  return `<item>
<g:id>${esc(p.sku)}</g:id>
<g:title>${esc(`${p.name.replace(/\s*\([^)]*\)\s*$/, '')} – ${p.brand}`.slice(0, 150))}</g:title>
<g:description>${esc(desc)}</g:description>
<g:link>${esc(abs(productPath(p)))}</g:link>
<g:image_link>${esc(abs(p.images[0]))}</g:image_link>
${p.images.slice(1, 6).map((i) => `<g:additional_image_link>${esc(abs(i))}</g:additional_image_link>`).join('\n')}
<g:availability>in_stock</g:availability>
<g:condition>new</g:condition>
<g:price>${money(sale ? Math.round(p.was! * (p.priceGross! / p.price!) * 100) / 100 : p.priceGross!)}</g:price>
${sale ? `<g:sale_price>${money(p.priceGross!)}</g:sale_price>` : ''}
<g:brand>${esc(p.brand)}</g:brand>
<g:mpn>${esc(p.sku)}</g:mpn>
<g:identifier_exists>no</g:identifier_exists>
<g:product_type>${esc(p.category)}</g:product_type>
${p.gender && p.gender !== 'Unisex' ? `<g:gender>${p.gender === 'Herren' ? 'male' : p.gender === 'Damen' ? 'female' : 'unisex'}</g:gender>${p.gender === 'Kinder' ? '<g:age_group>kids</g:age_group>' : '<g:age_group>adult</g:age_group>'}` : ''}
<g:color>${esc(p.colors.slice(0, 3).map((c) => c.name).join('/'))}</g:color>
${p.sizes.length && p.sizes[0] !== 'One Size' ? `<g:size>${esc(p.sizes.join(', ').slice(0, 100))}</g:size>` : ''}
${p.tiers.length ? `<g:custom_label_0>Staffelpreis ab ${p.tiers[0].min} Stück</g:custom_label_0>` : ''}
</item>`;
}).join('\n')}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
