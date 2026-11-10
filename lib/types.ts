export type Color = { name: string; hex?: string; image?: string };

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
  /** Einkaufspreis netto (L-Shop) – wird NIE an den Browser gegeben */
  basePrice: number;
  images: string[];
  colors: Color[];
  sizes: string[];
  stock?: number;
  tags?: string[];
};

/** Was der Browser sieht: Verkaufspreis statt Einkaufspreis */
export type PublicProduct = Omit<Product, 'basePrice'> & { price: number; priceGross: number };

export type Category = { name: string; slug: string; count: number };
