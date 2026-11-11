// Geometrie für die Live-Vorschau der Veredelung (Angaben in % der quadratischen Bühne)
import { posKind } from './deco';

export type View = 'front' | 'back';
export type Spot = { view: View; x: number; y: number; w: number; area: [number, number, number, number] };
export type Kind = ReturnType<typeof posKind>;

const S = (view: View, x: number, y: number, w: number, area: [number, number, number, number]): Spot => ({ view, x, y, w, area });

/** Positionen je Artikelart. „links/rechts“ = aus Sicht des Trägers (auf dem Bild also gespiegelt) */
export const SPOTS: Record<Kind, Record<string, Spot>> = {
  oberteil: {
    'Brust links': S('front', 61, 33, 10, [52, 20, 75, 50]),
    'Brust rechts': S('front', 39, 33, 10, [25, 20, 48, 50]),
    'Brust mittig': S('front', 50, 40, 30, [27, 22, 73, 75]),
    'Ärmel links': S('front', 84, 33, 7, [77, 23, 92, 47]),
    'Ärmel rechts': S('front', 16, 33, 7, [8, 23, 23, 47]),
    Rücken: S('back', 50, 46, 38, [25, 24, 75, 88]),
    Nacken: S('back', 50, 20, 12, [40, 15, 60, 28]),
  },
  cap: {
    'Front mittig': S('front', 50, 47, 24, [32, 33, 68, 62]),
    'Seite links': S('front', 73, 55, 10, [64, 45, 82, 66]),
    'Seite rechts': S('front', 27, 55, 10, [18, 45, 36, 66]),
    Hinten: S('back', 50, 58, 16, [38, 48, 62, 68]),
  },
  muetze: {
    'Front / Umschlag': S('front', 50, 69, 24, [32, 60, 68, 79]),
    'Seite links': S('front', 70, 69, 10, [62, 60, 76, 79]),
    'Seite rechts': S('front', 30, 69, 10, [24, 60, 38, 79]),
  },
  handtuch: {
    Bordüre: S('front', 50, 80, 40, [18, 74, 82, 87]),
    'Ecke unten rechts': S('front', 72, 66, 14, [58, 56, 84, 88]),
    'Ecke unten links': S('front', 28, 66, 14, [16, 56, 42, 88]),
    Mittig: S('front', 50, 46, 34, [18, 12, 82, 72]),
  },
  decke: {
    'Ecke unten rechts': S('front', 72, 78, 14, [56, 62, 84, 90]),
    'Ecke unten links': S('front', 28, 78, 14, [16, 62, 44, 90]),
    Mittig: S('front', 50, 50, 30, [18, 12, 82, 88]),
  },
  tasche: {
    'Vorderseite mittig': S('front', 50, 62, 36, [26, 40, 74, 88]),
    'Vorderseite oben': S('front', 50, 47, 26, [28, 38, 72, 60]),
    Rückseite: S('back', 50, 62, 36, [26, 40, 74, 88]),
  },
  hose: {
    'Oberschenkel links': S('front', 62, 34, 10, [55, 18, 72, 54]),
    'Oberschenkel rechts': S('front', 38, 34, 10, [28, 18, 45, 54]),
    'Gesäß / hinten': S('back', 60, 20, 10, [53, 12, 70, 34]),
    'Hosenbein unten': S('front', 64, 86, 8, [57, 76, 72, 92]),
  },
  schuerze: {
    'Latz mittig': S('front', 50, 26, 20, [38, 13, 62, 40]),
    Tasche: S('front', 50, 62, 18, [34, 54, 66, 72]),
    'Unten mittig': S('front', 50, 82, 26, [30, 74, 70, 92]),
  },
  schal: {
    'Ende links': S('front', 73, 76, 14, [64, 62, 84, 92]),
    'Ende rechts': S('front', 27, 76, 14, [16, 62, 36, 92]),
    Mittig: S('front', 50, 34, 20, [30, 24, 70, 46]),
  },
  unterwaesche: {
    'Bund vorne': S('front', 50, 29, 18, [34, 24, 66, 36]),
    'Bund hinten': S('back', 50, 29, 18, [34, 24, 66, 36]),
  },
  sonstiges: {
    Vorderseite: S('front', 50, 48, 30, [20, 18, 80, 82]),
    Rückseite: S('back', 50, 48, 30, [20, 18, 80, 82]),
  },
};

/** ungefähr: wie viele Zentimeter entsprechen 1 % der Bühnenbreite */
export const CM_PER_PCT: Record<Kind, number> = {
  oberteil: 0.93, cap: 0.36, muetze: 0.4, handtuch: 0.71, decke: 1.8, tasche: 0.55, hose: 0.6, schuerze: 0.85, schal: 0.6, unterwaesche: 0.45, sonstiges: 0.8,
};

/** Umrisse (viewBox 0 0 100 100) – neutrale Skizze, eingefärbt in der Artikelfarbe */
export const SHAPES: Record<Kind, { front: string[]; back?: string[]; detail?: string[] }> = {
  oberteil: {
    front: ['M36 11 L22 15 L5 28 L12 43 L22 38 L22 95 L78 95 L78 38 L88 43 L95 28 L78 15 L64 11 Q50 22 36 11 Z'],
    back: ['M36 11 L22 15 L5 28 L12 43 L22 38 L22 95 L78 95 L78 38 L88 43 L95 28 L78 15 L64 11 Q50 15 36 11 Z'],
    detail: ['M36 11 Q50 22 64 11'],
  },
  cap: { front: ['M20 63 Q20 27 50 27 Q80 27 80 63 Z', 'M17 63 Q50 74 86 65 L87 70 Q50 82 15 69 Z'], back: ['M20 66 Q20 27 50 27 Q80 27 80 66 Z'], detail: ['M50 27 L50 63'] },
  muetze: { front: ['M26 80 Q22 28 50 22 Q78 28 74 80 Z', 'M24 60 L76 60 L76 80 L24 80 Z'] },
  handtuch: { front: ['M14 8 H86 V92 H14 Z', 'M14 74 H86 V86 H14 Z'] },
  decke: { front: ['M10 8 H90 V92 H10 Z'] },
  tasche: { front: ['M22 36 H78 L80 94 H20 Z', 'M34 36 Q34 8 50 8 Q66 8 66 36 L62 36 Q62 13 50 13 Q38 13 38 36 Z'] },
  hose: { front: ['M28 6 L72 6 L76 95 L56 95 L50 38 L44 95 L24 95 Z'] },
  schuerze: { front: ['M37 10 L63 10 L63 34 L77 40 L75 95 L25 95 L23 40 L37 34 Z', 'M37 10 Q50 -6 63 10 L60 10 Q50 0 40 10 Z'] },
  schal: { front: ['M20 24 Q50 14 80 24 L80 40 Q50 32 20 40 Z', 'M64 34 L84 34 L86 94 L66 94 Z', 'M16 34 L36 34 L34 94 L14 94 Z'] },
  unterwaesche: { front: ['M22 22 H78 L74 46 Q62 52 56 70 H44 Q38 52 26 46 Z', 'M22 22 H78 V32 H22 Z'] },
  sonstiges: { front: ['M14 10 H86 V90 H14 Z'] },
};

export const spotsFor = (p: { category?: string; name?: string }) => { const k = posKind(p); return { kind: k, spots: SPOTS[k], cm: CM_PER_PCT[k], shape: SHAPES[k] }; };
export const cmFor = (kind: Kind, w: number) => Math.max(1, Math.round(w * CM_PER_PCT[kind]));
