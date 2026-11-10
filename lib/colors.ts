import type { Color } from './types';

function hsl(hex?: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}

/** Sortiert wie eine Farbkarte: Weiß → Grau → Schwarz, danach Regenbogen (Rot → Orange → Gelb → Grün → Blau → Lila → Pink), je Ton hell → dunkel */
export function sortColors(colors: Color[]): Color[] {
  const key = (c: Color) => {
    const v = hsl(c.hex);
    if (!v) return [2, 0, 0];
    const neutral = v.s < 0.18 || v.l > 0.93 || v.l < 0.1;
    if (neutral) return [0, 0, -v.l];
    const hue = (v.h + 15) % 360; // Rottöne (345–360°) an den Anfang
    return [1, Math.floor(hue / 30), -v.l];
  };
  return [...colors].sort((a, b) => {
    const ka = key(a), kb = key(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
  });
}

/** Hintergrund für Farbpunkte: Stoffmuster (meliert) oder Vollfarbe */
export const swatchBg = (c: Color) => (c.swatch ? `url("${c.swatch}") center/cover` : c.hex ?? '#ddd');
