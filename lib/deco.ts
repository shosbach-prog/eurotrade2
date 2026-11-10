// Veredelung – geteilt zwischen Shop (Client) und Server
export type Deco = { positions: string[]; method: string; logoId?: string | null; logoName?: string | null; note?: string };
export const METHODS = ['Druck', 'Stick', 'Beratung gewünscht'];
export const POSITIONS = ['Brust links', 'Brust mittig', 'Brust rechts', 'Rücken', 'Nacken', 'Ärmel links', 'Ärmel rechts'];
/** Vorschau-Position auf dem Frontbild (Prozent: links, oben, Breite) */
export const PREVIEW: Record<string, [number, number, number]> = {
  'Brust links': [60, 30, 14], 'Brust rechts': [40, 30, 14], 'Brust mittig': [50, 34, 28],
};
export const isImage = (name?: string | null) => /\.(png|jpe?g|webp|svg)$/i.test(name ?? '');
export const decoLabel = (d?: Deco | null) => (d ? `${d.method}: ${d.positions.join(', ')}${d.logoName ? ` · Logo: ${d.logoName}` : ''}` : '');
