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
/** Veredelungspositionen je Artikelart – erster Eintrag ist die Vorauswahl */
const POS = {
  oberteil: ['Brust links', 'Brust mittig', 'Brust rechts', 'Rücken', 'Nacken', 'Ärmel links', 'Ärmel rechts'],
  cap: ['Front mittig', 'Seite links', 'Seite rechts', 'Hinten'],
  muetze: ['Front / Umschlag', 'Seite links', 'Seite rechts'],
  handtuch: ['Bordüre', 'Ecke unten rechts', 'Ecke unten links', 'Mittig'],
  decke: ['Ecke unten rechts', 'Ecke unten links', 'Mittig'],
  tasche: ['Vorderseite mittig', 'Vorderseite oben', 'Rückseite'],
  hose: ['Oberschenkel links', 'Oberschenkel rechts', 'Gesäß / hinten', 'Hosenbein unten'],
  schuerze: ['Latz mittig', 'Tasche', 'Unten mittig'],
  schal: ['Ende links', 'Ende rechts', 'Mittig'],
  unterwaesche: ['Bund vorne', 'Bund hinten'],
  sonstiges: ['Vorderseite', 'Rückseite', 'Nach Absprache'],
} as const;
type PosKind = keyof typeof POS;

/** Erkennt die Artikelart aus Kategorie + Name (z. B. "Caps & Mützen" + "Beanie" → muetze) */
export function posKind(p: { category?: string; name?: string }): PosKind {
  // Erst am Namen erkennen (genauer), dann an der Kategorie – sonst wäre eine Cap in „Caps & Mützen“ eine Mütze
  return kindOf(p.name ?? '') ?? kindOf(p.category ?? '') ?? 'sonstiges';
}
function kindOf(raw: string): PosKind | null {
  const t = raw.toLowerCase();
  if (/beanie|mütze|muetze|bommel|stirnband/.test(t) && !/cap/.test(t)) return 'muetze';
  if (/cap\b|caps|kappe|hut\b|hüte|bucket|visor|snapback|trucker/.test(t)) return 'cap';
  if (/handtuch|handtücher|towel|duschtuch|gästetuch|saunatuch|badetuch|strandtuch|frottee/.test(t)) return 'handtuch';
  if (/decke|blanket|kissen|plaid/.test(t)) return 'decke';
  if (/tasche|bag\b|bags|beutel|rucksack|backpack|shopper/.test(t)) return 'tasche';
  if (/schürze|schuerze|apron/.test(t)) return 'schuerze';
  if (/schal\b|schals|halstuch|halstücher|scarf|loop/.test(t)) return 'schal';
  if (/hose|pants|trousers|shorts|jogger|leggings/.test(t)) return 'hose';
  if (/unterwäsche|bra\b|slip|boxer|briefs/.test(t)) return 'unterwaesche';
  if (/shirt|polo|hemd|bluse|sweat|hood|pullover|jacke|jacket|weste|bodywarmer|fleece|kittel|kasack|tunic|tunika|longsleeve|top\b|bademantel|trikot|tee\b/.test(t)) return 'oberteil';
  return null;
}
export const positionsFor = (p: { category?: string; name?: string }): string[] => [...POS[posKind(p)]];
/** Alle gültigen Positionen (für die Prüfung auf dem Server) */
export const POSITIONS: string[] = [...new Set(Object.values(POS).flat())];
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
  'Front mittig': [50, 32, 26], 'Front / Umschlag': [50, 62, 26],
  'Bordüre': [50, 80, 40], 'Ecke unten rechts': [74, 80, 18], 'Ecke unten links': [26, 80, 18],
  'Vorderseite mittig': [50, 52, 34], 'Vorderseite oben': [50, 32, 28], 'Latz mittig': [50, 30, 26],
};
export const isImage = (name?: string | null) => /\.(png|jpe?g|webp|svg)$/i.test(name ?? '');
export const decoText = (d?: Deco | null) => (d?.text ? `Text „${d.text.replace(/\n/g, ' / ')}“ (${d.font ?? FONTS[0].id}, ${d.textColor ?? 'Schwarz'})` : '');
export const decoLabel = (d?: Deco | null) => (d ? [`${d.method}: ${d.positions.join(', ')}`, d.logoName ? `Logo: ${d.logoName}` : '', decoText(d)].filter(Boolean).join(' · ') : '');

/** Veredelung auf einen anderen Artikel übertragen: unpassende Positionen (z. B. „Brust links“ auf einer Cap) werden ersetzt */
export function adaptDeco(d: Deco | null, p: { category?: string; name?: string }): Deco | null {
  if (!d) return d;
  const ok = positionsFor(p);
  const pos = d.positions.filter((x) => ok.includes(x));
  return { ...d, positions: pos.length ? pos : [ok[0]] };
}
