import type { MetadataRoute } from 'next';
import { previewMode } from '@/lib/access';
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  if (previewMode()) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: ['/', '/druck-stick', '/widerruf', '/garantie', '/ueber-uns', '/kategorie/', '/produkt/', '/p/'], disallow: ['/admin', '/api', '/angebot', '/warenkorb', '/merkliste', '/zugang'] }, sitemap: `${base}/sitemap.xml` };
}

export const dynamic = 'force-dynamic';
