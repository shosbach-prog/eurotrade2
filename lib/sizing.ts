/** Typische Größenverteilung bei Team-/Firmenbestellungen (Erwachsene, unisex) */
const SHARE: Record<string, number> = { XXS: 1, XS: 3, S: 12, M: 25, L: 28, XL: 20, XXL: 9, '2XL': 9, '3XL': 3, '4XL': 1, '5XL': 0.5 };

/** Gesamtmenge auf die vorhandenen Größen verteilen (größter Rest, Summe stimmt exakt) */
export function distribute(total: number, sizes: string[]): Record<string, number> | null {
  const use = sizes.filter((s) => SHARE[s] != null);
  if (use.length < 2 || total < 1) return null;
  const sum = use.reduce((a, s) => a + SHARE[s], 0);
  const raw = use.map((s) => ({ s, v: (total * SHARE[s]) / sum }));
  const out: Record<string, number> = Object.fromEntries(raw.map((r) => [r.s, Math.floor(r.v)]));
  let rest = total - Object.values(out).reduce((a, b) => a + b, 0);
  for (const r of [...raw].sort((a, b) => (b.v % 1) - (a.v % 1))) { if (rest <= 0) break; out[r.s]++; rest--; }
  return out;
}
export const canDistribute = (sizes: string[]) => sizes.filter((s) => SHARE[s] != null).length >= 2;

/** Brustumfang (Körpermaß, cm) bis einschließlich → Größe */
const MEN: [number, string][] = [[86, 'XS'], [94, 'S'], [102, 'M'], [110, 'L'], [118, 'XL'], [126, 'XXL'], [134, '3XL'], [142, '4XL'], [150, '5XL']];
const WOMEN: [number, string][] = [[80, 'XS'], [86, 'S'], [92, 'M'], [98, 'L'], [104, 'XL'], [110, 'XXL'], [118, '3XL'], [126, '4XL']];
export const SIZE_TABLE = { men: MEN, women: WOMEN };

export type Fit = 'oversize' | 'fitted' | 'regular';
export function fitOf(name: string, extra = ''): Fit {
  const s = `${name} ${extra}`.toLowerCase();
  if (/oversize|boxy|relaxed|loose|drop shoulder/.test(s)) return 'oversize';
  if (/slim|fitted|tailliert|figurbetont|skinny|stretch|tight|compression/.test(s)) return 'fitted';
  return 'regular';
}
export const isWomen = (gender?: string, name = '') => /damen|women|ladies|girl/i.test(`${gender ?? ''} ${name}`);

/** Empfehlung aus Brustumfang + gewünschtem Sitz */
export function advise(chest: number, sizes: string[], opts: { women: boolean; fit: Fit; want: 'eng' | 'normal' | 'locker' }): { size: string | null; note: string } {
  const tab = opts.women ? WOMEN : MEN;
  let i = tab.findIndex(([max]) => chest <= max);
  if (i < 0) i = tab.length - 1;
  if (opts.fit === 'oversize' && opts.want !== 'locker') i -= 1;
  if (opts.fit === 'fitted' && opts.want !== 'eng') i += 1;
  if (opts.fit === 'regular' && opts.want === 'locker') i += 1;
  i = Math.max(0, Math.min(tab.length - 1, i));
  const alias = (s: string) => (s === 'XXL' ? ['XXL', '2XL'] : [s]);
  // nächstgelegene vorhandene Größe
  for (let d = 0; d < tab.length; d++) for (const j of [i + d, i - d]) {
    const t = tab[j]; if (!t) continue;
    const hit = alias(t[1]).find((x) => sizes.includes(x));
    if (hit) return { size: hit, note: opts.fit === 'oversize' ? 'Oversize-Schnitt – fällt weit aus, wir empfehlen eher die kleinere Größe.' : opts.fit === 'fitted' ? 'Figurbetonter Schnitt – fällt eher eng aus, wir empfehlen eher die größere Größe.' : 'Normaler Schnitt.' };
  }
  return { size: null, note: 'Für diesen Artikel bitte die Größentabelle des Herstellers nutzen.' };
}
