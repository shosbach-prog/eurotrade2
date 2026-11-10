import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  return [{ url: `${base}/`, priority: 1 }, { url: `${base}/druck-stick`, priority: 0.8 }, { url: `${base}/impressum`, priority: 0.1 }];
}
