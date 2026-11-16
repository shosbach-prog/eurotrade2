import { allPublic } from '@/lib/catalog';
import { getText } from '@/lib/content';
import { productPath } from '@/lib/format';
import { previewMode } from '@/lib/access';
import { ownImage } from '@/lib/img';

export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n: number) => `${n.toFixed(2)} EUR`;
/** Versandkosten brutto (Deutschland) */
const SHIPPING = Number(process.env.SHIPPING_GROSS ?? 4.9);

/** Produkt-Feed für das Google Merchant Center (nur Artikel mit Preis, Preise inkl. MwSt.) */
export async function GET() {
  if (previewMode()) return new Response('Feed erst nach Freischaltung des Shops verfügbar.', { status: 404 });
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  const abs = (u: string) => (u.startsWith('http') ? u : `${base}${u}`);
  // Bilder immer von der eigenen Domain (externe L-Shop-Bilder über /api/img) – Google ruft sie zuverlässig ab
  const img = (u: string) => ownImage(u, base);
  const items = allPublic(null).filter((p) => p.price != null && p.priceGross != null && p.images.length);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>euro-trade.com – Markentextilien mit Logo</title>
<link>${base}</link>
<description>Textilien, Taschen und Werbemittel – ab 1 Stück, auf Wunsch bedruckt oder bestickt.</description>
${items.flatMap((p) => {
  const t = getText(p).text;
  const desc = `${(p.short || t.intro.split('\n\n')[0])} ${t.highlights.join(' · ')}`.slice(0, 4900);
  const sale = p.was != null;
  const ratio = p.priceGross! / p.price!;
  const gross = (net: number) => Math.round(net * ratio * 100) / 100;
  // Kleidung: je Größe ein Eintrag (Google verlangt in DE eine einzelne Größe), gruppiert über item_group_id
  const sizes = p.sizes.filter((s) => s && !/^one ?size$/i.test(s));
  const variants: (string | null)[] = sizes.length > 1 ? sizes : [sizes[0] ?? null];
  const apparel = sizes.length > 0;
  return variants.map((size) => {
    const up = size && p.sizeUp?.[size] ? p.sizeUp[size] : 0;
    const price = p.fixedGross ? p.priceGross! : gross(p.price! + up);
    const was = sale ? gross(p.was! + up) : null;
    const id = size && variants.length > 1 ? `${p.sku}-${size}`.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/-$/, '').slice(0, 50) : p.sku;
    return `<item>
<g:id>${esc(id)}</g:id>
${variants.length > 1 ? `<g:item_group_id>${esc(p.sku)}</g:item_group_id>` : ''}
<g:title>${esc(`${p.name.replace(/\s*\([^)]*\)\s*$/, '')}${p.collection ? '' : ` – ${p.brand}${p.model ? ` ${p.model}` : ''}`}${size && variants.length > 1 ? ` (Größe ${size})` : ''}`.slice(0, 150))}</g:title>
<g:description>${esc(desc)}</g:description>
<g:link>${esc(abs(productPath(p)))}?preis=brutto</g:link>
<g:image_link>${esc(img(p.images[0]))}</g:image_link>
${p.images.slice(1, 6).map((i) => `<g:additional_image_link>${esc(img(i))}</g:additional_image_link>`).join('\n')}
<g:availability>in_stock</g:availability>
<g:condition>new</g:condition>
<g:price>${money(was ?? price)}</g:price>
${was != null ? `<g:sale_price>${money(price)}</g:sale_price>` : ''}
<g:shipping><g:country>DE</g:country><g:service>Standard</g:service><g:price>${money(SHIPPING)}</g:price></g:shipping>
<g:brand>${esc(p.brand)}</g:brand>
<g:mpn>${esc(p.sku)}</g:mpn>
<g:identifier_exists>no</g:identifier_exists>
<g:product_type>${esc(p.category)}</g:product_type>
${apparel ? `<g:gender>${p.gender === 'Herren' ? 'male' : p.gender === 'Damen' ? 'female' : 'unisex'}</g:gender><g:age_group>${p.gender === 'Kinder' ? 'kids' : 'adult'}</g:age_group>` : ''}
<g:color>${esc(p.colors.slice(0, 3).map((c) => c.name).join('/'))}</g:color>
${size ? `<g:size>${esc(size.slice(0, 100))}</g:size>` : ''}
${p.tiers.length ? `<g:custom_label_0>Staffelpreis ab ${p.tiers[0].min} Stück</g:custom_label_0>` : ''}
${p.collection ? `<g:custom_label_1>${esc(p.collection)}</g:custom_label_1>` : ''}
</item>`;
  });
}).join('\n')}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
