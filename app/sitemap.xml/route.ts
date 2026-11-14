import { previewMode } from '@/lib/access';
import { sitemapEntries } from '@/lib/sitemap-data';

export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** sitemap.xml inkl. Bild-Sitemap (Artikelfotos für die Google-Bildersuche) */
export function GET() {
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  const abs = (u: string) => (u.startsWith('http') ? u : `${base}${u}`);
  const list = previewMode() ? sitemapEntries().filter((e) => !e.path.match(/^\/(marken\/|team\/)/) && !e.group.startsWith('Artikel') && e.group !== 'Kategorien') : sitemapEntries();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${list.map((e) => `<url><loc>${esc(base + e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}<changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority>${(e.images ?? []).map((i) => `<image:image><image:loc>${esc(abs(i.loc))}</image:loc></image:image>`).join('')}</url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
