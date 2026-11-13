import 'server-only';
import path from 'node:path';
import fs from 'node:fs';
import { DATA, UPLOADS, listInquiries, randomId, readJSON, writeJSON } from './store';
import { allProductsBrief } from './catalog';

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
export const listTeamShops = () => { ensurePresets(); return readJSON<TeamShop[]>(F, []); };

/** Vorbelegte Motiv-Shops (seed/motive/<slug>/*.png) – werden einmalig angelegt; gelöscht bleibt gelöscht */
const PRESETS: { slug: string; name: string; note?: string }[] = [{ slug: 'politik-insider', name: 'Politik Insider' }];
const PRESET_MARK = path.join(DATA, 'presets.json');
let presetsChecked = false;
function ensurePresets() {
  if (presetsChecked) return;
  presetsChecked = true;
  try {
    const done = readJSON<Record<string, string>>(PRESET_MARK, {});
    for (const pr of PRESETS) {
      if (done[pr.slug]) continue;
      const dir = path.join(process.cwd(), 'seed', 'motive', pr.slug);
      if (!fs.existsSync(dir)) continue;
      const list = readJSON<TeamShop[]>(F, []);
      if (!list.some((t) => t.slug === pr.slug)) {
        fs.mkdirSync(UPLOADS, { recursive: true });
        const motifs = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|svg|webp)$/i.test(f)).sort().map((f) => {
          const id = randomId(); const ext = f.split('.').pop()!.toLowerCase();
          fs.copyFileSync(path.join(dir, f), path.join(UPLOADS, `${id}.${ext}`));
          writeJSON(path.join(UPLOADS, `${id}.json`), { name: f, ext, size: fs.statSync(path.join(dir, f)).size, date: new Date().toISOString() });
          return { id, name: f.replace(/\.[^.]+$/, '').replace(/^\d+[\s._-]*/, '').trim() || 'Motiv' };
        });
        // Vorauswahl: die ersten T-Shirts aus dem Katalog – im Admin anpassbar
        const items = allProductsBrief().filter((p) => p.categorySlug === 't-shirts').slice(0, 6).map((p) => p.id);
        list.push({ slug: pr.slug, name: pr.name, active: true, logoId: null, logoName: null, items, method: 'Druck', positions: ['Brust mittig'], personalize: 'aus', deadline: null, note: pr.note ?? '', contact: '', motifs, price: null, createdAt: new Date().toISOString() });
        saveTeamShops(list);
      }
      done[pr.slug] = new Date().toISOString();
      writeJSON(PRESET_MARK, done);
    }
  } catch (e) { console.error('Motiv-Presets:', e); }
}
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
