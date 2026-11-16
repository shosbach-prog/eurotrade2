/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  poweredByHeader: false,
  // Browser und Crawler fragen /favicon.ico ab – auf das vorhandene Icon leiten statt 404
  async redirects() { return [{ source: '/favicon.ico', destination: '/icon.svg', permanent: true }]; },
  // Seiten nicht im Browser-Zwischenspeicher halten – sonst zeigt z. B. der Admin nach dem Löschen kurz den alten Stand
  experimental: { staleTimes: { dynamic: 0, static: 30 } },
};
export default nextConfig;
