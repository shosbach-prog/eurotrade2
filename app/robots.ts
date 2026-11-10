import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  return { rules: { userAgent: '*', allow: ['/', '/druck-stick'], disallow: ['/admin', '/api', '/angebot', '/warenkorb', '/merkliste', '/zugang'] }, sitemap: `${base}/sitemap.xml` };
}
