export type Color = { name: string; hex?: string; image?: string; /** Produktbilder in dieser Farbe (aus Feed/API) */ images?: string[]; /** Stoffmuster (data-URI) für melierte Farben */ swatch?: string };

/** Einheitliches Produktformat – der L-Shop-Sync schreibt genau dieses Format nach data/products.json */
export type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  description: string;
  material?: string;
  gender?: string;
  /** Einkaufspreis netto (L-Shop) – wird NIE an den Browser gegeben; null = Preis auf Anfrage */
  basePrice: number | null;
  features?: string[];
  composition?: string;
  specs?: Record<string, string>;
  images: string[];
  /** Link zur Größentabelle (PDF des Herstellers) */
  sizeChart?: string;
  colors: Color[];
  sizes: string[];
  stock?: number;
  /** Bestand je Variante: "Farbe|Größe" -> Stück (aus Feed/API) */
  stockBy?: Record<string, number>;
  /** Staffel-Einkaufspreise von L-Shop: ab Menge -> EK netto */
  baseTiers?: { min: number; price: number }[];
  /** EK-Aufpreis je Größe gegenüber basePrice (L-Shop-Preisliste, z. B. 3XL +1,35) */
  sizeExtra?: Record<string, number>;
  tags?: string[];
  /** Auslauf laut L-Shop-Liste (berechnet, nicht gespeichert) */
  eol?: Eol;
  /** Passende Artikel (Art.-Nr.), z. B. Damen-/Herrenmodell */
  pairs?: string[];
  /** Admin: im Shop ausgeblendet */
  hidden?: boolean;
  /** Admin: oben anzeigen */
  top?: boolean;
  /** Admin: Sonderangebot (Rabatt in % auf den Verkaufspreis, 0 = nur markiert) */
  sale?: { pct: number };
  /** Admin: selbst angelegter Artikel */
  custom?: boolean;
};

/** Auslaufartikel: ganzer Artikel (all) oder einzelne Farben/Größen (sizes null = alle Größen der Farbe), Datum JJJJ-MM-TT oder null = solange Vorrat */
export type Eol = { all: boolean; date: string | null; colors: Record<string, { sizes: string[] | null; date: string | null }> };

/** Was der Browser sieht: Verkaufspreis statt Einkaufspreis */
export type PublicProduct = Omit<Product, 'basePrice' | 'baseTiers' | 'sizeExtra'> & { /** Verkaufs-Aufpreis je Größe (netto) */ sizeUp?: Record<string, number>; price: number | null; priceGross: number | null; /** Staffelpreise netto (ab Menge) */ tiers: { min: number; price: number }[]; /** Kundenbewertung (nur freigegebene, verifizierte) */ rating?: { avg: number; count: number } | null; /** Schaufenster ohne Preise */ locked?: boolean; /** Filter-Eigenschaften (Nachhaltig, Schwere Qualität …) */ props?: string[]; /** alle Bilder auch als .webp vorhanden */ webp?: boolean; /** alle Bilder auch als kleine .m.webp (480 px) vorhanden */ mid?: boolean; /** Sonderangebot: ursprünglicher Preis (netto) */ was?: number | null };

export type Category = { name: string; slug: string; count: number };
