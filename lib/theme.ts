/**
 * Saison-Theme. SHOP_THEME in .env:
 *   auto (Standard) – Weihnachts-Look vom 15. Nov. bis 6. Jan., sonst normal
 *   xmas            – Weihnachts-Look immer an
 *   normal          – Weihnachts-Look immer aus
 */
export function isXmas(now = new Date()): boolean {
  const mode = (process.env.SHOP_THEME ?? 'auto').toLowerCase();
  if (mode === 'xmas') return true;
  if (mode === 'normal' || mode === 'off') return false;
  const m = now.getMonth(), d = now.getDate();
  return (m === 10 && d >= 15) || m === 11 || (m === 0 && d <= 6);
}
