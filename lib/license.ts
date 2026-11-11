/** Bildlizenz L-SHOP: gilt je Kalenderjahr (Bilder von B&C, Build Your Brand, Markenlogos) */
export function licenseInfo(now = new Date()) {
  const until = new Date(process.env.IMAGE_LICENSE_UNTIL ?? '2026-12-31T23:59:59');
  const days = Math.ceil((until.getTime() - now.getTime()) / 864e5);
  return { until, days, warn: days <= 60, expired: days < 0 };
}
