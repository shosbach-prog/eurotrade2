import type { Color, Product } from './types';

/** Gemeinsame Prüfung von Artikeldaten – Admin-Editor und Shop-API (/api/v1) */
export const str = (v: unknown, max = 200) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);
export const list = (v: unknown, max = 60) => (Array.isArray(v) ? v : []).map((x) => str(x, 300)).filter(Boolean).slice(0, max);
export const num = (v: unknown) => { const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null; };
export const img = (s: string) => /^(\/p\/|\/api\/bild\/[a-f0-9]{24}$|https:\/\/)/.test(s);


/** Formulardaten prüfen und in Produktfelder übersetzen */
export function clean(d: Record<string, unknown>): Partial<Product> {
  const colors: Color[] = (Array.isArray(d.colors) ? d.colors : []).slice(0, 80).map((c: Record<string, unknown>) => ({
    ...(c as Color),
    name: str(c?.name, 60),
    hex: /^#[0-9a-f]{6}$/i.test(String(c?.hex)) ? String(c.hex) : undefined,
    image: c?.image && img(String(c.image)) ? String(c.image) : undefined,
  })).filter((c) => c.name);
  const tiers = (Array.isArray(d.baseTiers) ? d.baseTiers : []).map((t: { min?: unknown; price?: unknown }) => ({ min: Math.floor(Number(t?.min)), price: num(t?.price) }))
    .filter((t): t is { min: number; price: number } => t.min > 1 && t.price != null).sort((a, b) => a.min - b.min).slice(0, 10);
  const specs: Record<string, string> = {};
  for (const [k, v] of Object.entries((d.specs as Record<string, unknown>) ?? {}).slice(0, 30)) if (str(k, 60) && str(v, 300)) specs[str(k, 60)] = str(v, 300);
  return {
    hidden: !!d.hidden, top: !!d.top,
    sku: str(d.sku, 40), name: str(d.name, 120), brand: str(d.brand, 60), category: str(d.category, 60) || 'Sonstiges',
    basePrice: num(d.basePrice), baseTiers: tiers,
    description: str(d.description, 20000), material: str(d.material, 200), composition: str(d.composition, 200), gender: str(d.gender, 40),
    features: list(d.features, 20), tags: list(d.tags, 20), pairs: list(d.pairs, 12).map((s) => s.toUpperCase().slice(0, 40)), sizes: list(d.sizes, 30).map((s) => s.slice(0, 40)),
    images: list(d.images, 30).filter(img), colors, specs, sizeChart: str(d.sizeChart, 400) || undefined,
  };
}
/** Zusatzfelder (nur wenn mitgeschickt): Slug, SEO, Alttext, Kurztext, Festpreis brutto */
export function cleanExtra(d: Record<string, unknown>): Partial<Product> {
  const o: Partial<Product> = {};
  if ('slug' in d) { const s = str(d.slug, 120).toLowerCase(); if (/^[a-z0-9-]+$/.test(s)) o.slug = s; }
  if (d.seo && typeof d.seo === 'object') { const x = d.seo as Record<string, unknown>; o.seo = { title: str(x.title, 120), description: str(x.description, 320) }; }
  if ('imageAlt' in d) o.imageAlt = str(d.imageAlt, 300);
  if ('short' in d) o.short = str(d.short, 1000);
  if ('fixedGross' in d) { const n = num(d.fixedGross); if (n != null) o.fixedGross = n; }
  return o;
}
