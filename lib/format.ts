export const eur = (n: number | null | undefined) =>
  n == null ? 'auf Anfrage' : n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
export const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
