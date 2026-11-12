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
/** Feste Seiten der obersten Ebene – Kategorien mit diesem Namen behalten /produkt/… */
export const RESERVED_TOP = ['feed', 'admin', 'agb', 'aktion', 'angebot', 'api', 'bewerten', 'datenschutz', 'druck-stick', 'fuer', 'garantie', 'impressum', 'kategorie', 'kontakt', 'konto', 'marken', 'merkliste', 'newsletter', 'passwort', 'produkt', 'produktsicherheit', 'ratgeber', 'rechnung', 'registrieren', 'start', 'suche', 'team', 'ueber-uns', 'warenkorb', 'widerruf', 'zugang', 'p', 'picto', 'brands', 'uploads', 'img', 'detail', '_next'];
/** Artikel-URL: /<kategorie>/<artikelname>, z. B. /jacken/windbreaker-zweifarbig-herren-by129 */
export const productPath = (p: { name: string; sku: string; id?: string; categorySlug?: string }) =>
  p.categorySlug && !RESERVED_TOP.includes(p.categorySlug) ? `/${p.categorySlug}/${productSlug(p)}` : `/produkt/${productSlug(p)}`;
/** Kategorie-/Unterkategorie-URL ohne Präfix: /t-shirts, /sweatjacken, /t-shirts-herren */
export const catPath = (slug: string) => (RESERVED_TOP.includes(slug) ? `/kategorie/${slug}` : `/${slug}`);
/** Sieht die Adresse wie eine Kategorie-URL aus? (/kategorie/x oder /<slug>) */
export const isCategoryUrl = (path: string) => path.startsWith('/kategorie/') || (/^\/[a-z0-9-]+\/?$/.test(path) && !RESERVED_TOP.includes(path.replace(/\//g, '')));
/** Sieht die Adresse wie eine Artikel-URL aus? (/produkt/x oder /<kategorie>/<artikel>) */
export const isProductUrl = (path: string) => {
  if (path.startsWith('/produkt/')) return true;
  const m = path.match(/^\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/);
  return !!m && !RESERVED_TOP.includes(m[1]);
};
