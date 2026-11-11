// Veredelung – geteilt zwischen Shop (Client) und Server
export type Motif = 'logo' | 'text' | 'beides';
export type Deco = {
  positions: string[]; method: string;
  motif?: Motif;
  logoId?: string | null; logoName?: string | null;
  /** Textveredelung */
  text?: string | null; font?: string | null; textColor?: string | null;
  note?: string;
};
export const METHODS = ['Druck', 'Stick', 'Beratung gewünscht'];
export const POSITIONS = ['Brust links', 'Brust mittig', 'Brust rechts', 'Rücken', 'Nacken', 'Ärmel links', 'Ärmel rechts'];
export const MOTIFS: { id: Motif; label: string }[] = [{ id: 'logo', label: 'Logo' }, { id: 'text', label: 'Text' }, { id: 'beides', label: 'Logo + Text' }];
export const FONTS: { id: string; css: string }[] = [
  { id: 'Klassisch', css: 'Arial, Helvetica, sans-serif' },
  { id: 'Sport', css: 'Impact, "Arial Black", "Helvetica Neue", sans-serif' },
  { id: 'Elegant', css: 'Georgia, "Times New Roman", serif' },
  { id: 'Schreibschrift', css: '"Brush Script MT", "Segoe Script", "Snell Roundhand", cursive' },
  { id: 'Schreibmaschine', css: '"Courier New", Courier, monospace' },
];
export const TEXT_COLORS: { id: string; hex: string }[] = [
  { id: 'Weiß', hex: '#ffffff' }, { id: 'Schwarz', hex: '#111111' }, { id: 'Rot', hex: '#c8102e' }, { id: 'Royalblau', hex: '#1d4ed8' },
  { id: 'Navy', hex: '#0c2340' }, { id: 'Gelb', hex: '#f2c200' }, { id: 'Orange', hex: '#f26b1d' }, { id: 'Grün', hex: '#1e7b34' },
  { id: 'Pink', hex: '#e0218a' }, { id: 'Silber', hex: '#b8bcc2' }, { id: 'Gold', hex: '#c9a227' },
];
export const fontCss = (id?: string | null) => FONTS.find((f) => f.id === id)?.css ?? FONTS[0].css;
export const colorHex = (id?: string | null) => TEXT_COLORS.find((c) => c.id === id)?.hex ?? '#111111';
/** Vorschau-Position auf dem Frontbild (Prozent: links, oben, Breite) */
export const PREVIEW: Record<string, [number, number, number]> = {
  'Brust links': [60, 30, 14], 'Brust rechts': [40, 30, 14], 'Brust mittig': [50, 34, 28],
};
export const isImage = (name?: string | null) => /\.(png|jpe?g|webp|svg)$/i.test(name ?? '');
export const decoText = (d?: Deco | null) => (d?.text ? `Text „${d.text.replace(/\n/g, ' / ')}“ (${d.font ?? FONTS[0].id}, ${d.textColor ?? 'Schwarz'})` : '');
export const decoLabel = (d?: Deco | null) => (d ? [`${d.method}: ${d.positions.join(', ')}`, d.logoName ? `Logo: ${d.logoName}` : '', decoText(d)].filter(Boolean).join(' · ') : '');
