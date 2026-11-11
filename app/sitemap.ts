import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  return [{ url: `${base}/`, priority: 1 }, { url: `${base}/druck-stick`, priority: 0.8 }, { url: `${base}/widerruf`, priority: 0.3 }, { url: `${base}/garantie`, priority: 0.4 }, { url: `${base}/impressum`, priority: 0.1 }];
}

export const dynamic = 'force-dynamic';
