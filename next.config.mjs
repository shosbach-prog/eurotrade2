import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  poweredByHeader: false,
  // Browser und Crawler fragen /favicon.ico ab – auf das vorhandene Icon leiten statt 404
  // Sicherheits-Header (PageSpeed „Best Practices“): HTTPS erzwingen, fremde Fenster vom eigenen Kontext trennen
  async headers() { return [{ source: '/:path*', headers: [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }, { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }] }]; },
  async redirects() { return [{ source: '/favicon.ico', destination: '/icon.svg', permanent: true }]; },
  // Seiten nicht im Browser-Zwischenspeicher halten – sonst zeigt z. B. der Admin nach dem Löschen kurz den alten Stand
  // inlineCss: Styles stehen direkt im HTML – keine render-blockierende CSS-Anfrage mehr
  experimental: { staleTimes: { dynamic: 0, static: 30 }, inlineCss: true },
  // Next liefert Polyfills für Browser von vor 2021 mit (Array.at, flatMap, Object.fromEntries …) – alle aktuellen Browser können das selbst
  webpack(config, { isServer }) {
    if (!isServer) config.resolve.alias[require.resolve('next/dist/build/polyfills/polyfill-module')] = false;
    return config;
  },
};
export default nextConfig;
