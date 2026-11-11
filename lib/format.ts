export const eur = (n: number | null | undefined) =>
  n == null ? 'auf Anfrage' : n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
export const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Sprechende Produkt-URL aus dem Artikelnamen, z. B. „Poloshirt Unisex (BCPU427)“ → /produkt/poloshirt-unisex-bcpu427 (Art.-Nr. wird angehängt, falls nicht im Namen) */
export const productSlug = (p: { name: string; sku: string }) => {
  const s = slugify(p.name.replace(/[´'’`]/g, '')), k = slugify(p.sku);
  return !k || s.split('-').join('').includes(k.split('-').join('')) ? s || k : `${s}-${k}`;
};
export const productPath = (p: { name: string; sku: string; id?: string }) => `/produkt/${productSlug(p)}`;
