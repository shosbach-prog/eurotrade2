import 'server-only';
import { getByCategory, getCategories, getProduct, productCount, search } from './catalog';
import { getText } from './content';
import { catPath, isCategoryUrl, isProductUrl, productPath } from './format';
import { gross } from './pricing';
import { listTeamShops } from './teamshop';
import type { PublicProduct } from './types';

/** Markdown-Fassungen der Shop-Seiten für KI-Agenten (Accept: text/markdown) und /llms.txt */
export const site = () => (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
const eur = (n: number) => `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const priceLine = (p: PublicProduct) => (p.price == null ? 'Preis auf Anfrage' : `${eur(p.price)} netto (${eur(gross(p.price))} inkl. MwSt.) je Stück${p.tiers.length ? `, ab ${p.tiers[p.tiers.length - 1].min} Stk. ${eur(p.tiers[p.tiers.length - 1].price)} netto` : ''}`);

const ORDER = `## So bestellen
- Artikel auf euro-trade.com wählen, Farbe/Größen/Menge festlegen, optional Logo hochladen (Druck oder Stick, ab 1 Stück).
- Anfrage absenden – verbindliches Angebot innerhalb von 24 Stunden.
- Kontakt: info@euro-trade.com · Telefon 030 40719258`;

export function llmsTxt() {
  const s = site();
  const cats = getCategories().filter((c) => c.count > 0);
  const teams = listTeamShops().filter((t) => t.active && t.indexed);
  return `# euro-trade.com

> Onlineshop für Markentextilien und Werbeartikel (B2B und privat) aus Dortmund: ${productCount().toLocaleString('de-DE')} Artikel von Marken wie B&C, Fruit of the Loom, Stanley/Stella, Result und Beechfield – auf Wunsch bedruckt oder bestickt, schon ab 1 Stück. Preise sind online sichtbar (netto und brutto), Staffelpreise ab größeren Mengen.

Alle Seiten liefern mit \`Accept: text/markdown\` eine Markdown-Fassung.

## Sortiment
${cats.map((c) => `- [${c.name}](${s}${catPath(c.slug)}): ${c.count} Artikel`).join('\n')}

## Service
- [Druck & Stick](${s}/druck-stick): Veredelung, Verfahren und Preise
- [Ratgeber](${s}/ratgeber): Tipps zu Teamkleidung, Firmenbekleidung, Textildruck
- [Marken](${s}/marken): alle Marken im Sortiment
- [Kontakt & Anfrage](${s}/kontakt)
- [Produkt-Feed (Google Merchant, XML)](${s}/feed/google.xml): alle Artikel mit Preis, Verfügbarkeit, Bild
${teams.length ? `\n## Motiv- und Team-Shops\n${teams.map((t) => `- [${t.name}](${s}/team/${t.slug})${t.motifs?.length ? `: ${t.motifs.length} Motive, gedruckt ab 1 Stück` : ''}`).join('\n')}\n` : ''}
${ORDER}

## Optional
- [AGB](${s}/agb) · [Widerruf](${s}/widerruf) · [Impressum](${s}/impressum) · [Datenschutz](${s}/datenschutz)
`;
}

function productMd(p: PublicProduct) {
  const s = site(); const t = getText(p).text;
  return `# ${p.name}

- Marke: ${p.brand}
- Artikelnummer: ${p.sku}
- Kategorie: [${p.category}](${s}${catPath(p.categorySlug)})
- Preis: ${priceLine(p)}
${p.tiers.length ? `- Staffelpreise (netto): ${p.tiers.map((x) => `ab ${x.min} Stk. ${eur(x.price)}`).join(' · ')}\n` : ''}- Farben (${p.colors.length}): ${p.colors.map((c) => c.name).join(', ')}
- Größen: ${p.sizes.join(', ') || '–'}
- Link: ${s}${productPath(p)}
${p.images[0] ? `\n![${p.name}](${p.images[0].startsWith('http') ? p.images[0] : s + p.images[0]})\n` : ''}
## ${t.headline}

${t.intro}
${t.highlights.length ? `\n${t.highlights.map((h) => `- ${h}`).join('\n')}\n` : ''}${t.idealFor ? `\nIdeal für: ${t.idealFor}\n` : ''}
Auf Wunsch mit Logo bedruckt oder bestickt – schon ab 1 Stück.

${ORDER}
`;
}

function listMd(title: string, items: PublicProduct[], intro = '') {
  const s = site();
  return `# ${title}

${intro}${items.length} Artikel. Preise netto je Stück (zzgl. MwSt.).

${items.slice(0, 200).map((p) => `- [${p.name}](${s}${productPath(p)}) – ${p.brand}, Art.-Nr. ${p.sku} – ${p.price == null ? 'Preis auf Anfrage' : `ab ${eur(p.tiers.length ? p.tiers[p.tiers.length - 1].price : p.price)}`} – ${p.colors.length} Farben`).join('\n')}
${items.length > 200 ? `\n… und ${items.length - 200} weitere: ${s}/suche\n` : ''}
${ORDER}
`;
}

/** Markdown zu einem Seitenpfad – null, wenn es keine eigene Fassung gibt */
export function pageMarkdown(path: string): string | null {
  const s = site();
  const clean = path.split('?')[0].replace(/\/$/, '') || '/';
  if (clean === '/' || clean === '/start') return llmsTxt();
  if (clean === '/suche') return null;
  if (isProductUrl(clean)) {
    const p = getProduct(decodeURIComponent(clean.split('/').pop() ?? ''), null);
    return p ? productMd(p) : null;
  }
  if (isCategoryUrl(clean)) {
    const slug = clean.replace(/^\/(kategorie\/)?/, '');
    const c = getCategories().find((x) => x.slug === slug);
    if (c) return listMd(c.name, getByCategory(c.slug, null), `Kategorie auf ${s}. `);
  }
  return null;
}

/** Suche für Agenten (WebMCP / API) */
export const agentSearch = (q: string, n = 10) => search(q, n, null).map((p) => ({ name: p.name, brand: p.brand, sku: p.sku, category: p.category, price_net_eur: p.price, url: `${site()}${productPath(p)}`, colors: p.colors.length }));
