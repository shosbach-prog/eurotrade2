/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  poweredByHeader: false,
  // Seiten nicht im Browser-Zwischenspeicher halten – sonst zeigt z. B. der Admin nach dem Löschen kurz den alten Stand
  experimental: { staleTimes: { dynamic: 0, static: 30 } },
};
export default nextConfig;
