import type { MetadataRoute } from 'next';
import { previewMode } from '@/lib/access';
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  if (previewMode()) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: ['/', '/fuer/', '/aktion/', '/api/bild/', '/druck-stick', '/widerruf', '/garantie', '/ueber-uns', '/p/'], disallow: ['/admin', '/api', '/angebot', '/warenkorb', '/merkliste', '/zugang'] }, sitemap: `${base}/sitemap.xml` };
}

export const dynamic = 'force-dynamic';
