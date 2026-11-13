import 'server-only';
import path from 'node:path';
import { DATA, listInquiries, readJSON, writeJSON } from './store';

/** Vereins-/Team-Shop: eigene Seite mit Vereinslogo und ausgewählten Artikeln – Mitglieder bestellen selbst, geliefert wird gesammelt */
export type TeamShop = {
  slug: string; name: string; active: boolean;
  logoId?: string | null; logoName?: string | null;
  /** Artikel-IDs */
  items: string[];
  /** feste Veredelung: Verfahren + Positionen */
  method: string; positions: string[];
  /** Mitglieder können Name/Nummer ergänzen */
  personalize: 'aus' | 'name' | 'nummer' | 'beides';
  deadline?: string | null; note?: string; contact?: string; color?: string;
  /** Motiv-Shop: Kunden wählen eines dieser Motive (Upload-IDs), das direkt aufs Shirt gedruckt wird */
  motifs?: TeamMotif[];
  /** Festpreis netto je Teil inkl. Veredelung (leer = normale Kalkulation) */
  price?: number | null;
  createdAt: string;
};
export type TeamMotif = { id: string; name: string };
/** Festpreis für einen Artikel dieses Shops (nur Artikel des Shops) */
export const teamFixedPrice = (t: TeamShop | null | undefined, productId: string) => (t && t.price && t.price > 0 && t.items.includes(productId) ? t.price : null);
export const isMotifShop = (t: TeamShop | null | undefined) => !!t?.motifs?.length;
const F = path.join(DATA, 'teamshops.json');
export const listTeamShops = () => readJSON<TeamShop[]>(F, []);
export const saveTeamShops = (l: TeamShop[]) => writeJSON(F, l);
export const getTeamShop = (slug: string) => listTeamShops().find((t) => t.slug === slug && t.active) ?? null;
export const teamSlug = (s: string) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
export const isOpen = (t: TeamShop) => t.active && (!t.deadline || Date.parse(t.deadline + 'T23:59:59') >= Date.now());

/** Sammelbestellung: alle Anfragen eines Team-Shops nach Artikel / Farbe / Größe summiert */
export function teamOrders(slug: string) {
  const inqs = listInquiries().filter((i) => i.team === slug && i.status !== 'abgelehnt');
  const sum = new Map<string, { sku: string; name: string; color: string; motif?: string; sizes: Record<string, number>; total: number }>();
  const people: { no: string; name: string; email: string; date: string; pieces: number; status: string; personal: string[] }[] = [];
  for (const i of inqs) {
    let pieces = 0; const personal: string[] = [];
    for (const l of i.lines) {
      const motif = l.deco?.logoName?.startsWith('Motiv: ') ? l.deco.logoName.slice(7) : undefined;
      const k = `${l.sku}|${l.color}|${motif ?? ''}`;
      const e = sum.get(k) ?? { sku: l.sku, name: l.name, color: l.color, ...(motif ? { motif } : {}), sizes: {}, total: 0 };
      e.sizes[l.size || '–'] = (e.sizes[l.size || '–'] ?? 0) + l.qty; e.total += l.qty; sum.set(k, e);
      pieces += l.qty;
      for (const r of l.deco?.team?.rows ?? []) personal.push([r.name, r.nr && `#${r.nr}`, r.size && `(${r.size})`].filter(Boolean).join(' '));
    }
    people.push({ no: i.no, name: i.customer.name, email: i.customer.email, date: i.date, pieces, status: i.status ?? 'neu', personal });
  }
  return { inquiries: inqs.length, items: [...sum.values()].sort((a, b) => (a.motif ?? '').localeCompare(b.motif ?? '') || a.sku.localeCompare(b.sku)), people };
}
