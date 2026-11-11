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
  tags?: string[];
};

/** Was der Browser sieht: Verkaufspreis statt Einkaufspreis */
export type PublicProduct = Omit<Product, 'basePrice' | 'baseTiers'> & { price: number | null; priceGross: number | null; /** Staffelpreise netto (ab Menge) */ tiers: { min: number; price: number }[] };

export type Category = { name: string; slug: string; count: number };
