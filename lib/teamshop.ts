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
  /** weitere Vereinslogos – Mitglieder wählen eines (Hauptlogo = logoId) */
  logos?: TeamMotif[];
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

/** Vorbelegte Motiv-Shops (seed/motive/<slug>/*) – Shop wird einmalig angelegt (gelöscht bleibt gelöscht);
 *  neue Dateien im Ordner kommen bei bestehendem Shop automatisch als weitere Motive dazu (im Admin entfernte nicht wieder) */
const PRESETS: { slug: string; name: string; note?: string }[] = [{ slug: 'politik-insider', name: 'Politik Insider' }, { slug: 'tristement', name: 'Tristement' }];
const PRESET_MARK = path.join(DATA, 'presets.json');
type Mark = { at: string; files: string[]; deleted?: boolean };
let presetsChecked = false;
const motifName = (f: string) => f.replace(/\.[^.]+$/, '').replace(/^\d+[\s._-]*/, '').trim() || 'Motiv';
function importMotif(dir: string, f: string) {
  const id = randomId(); const ext = f.split('.').pop()!.toLowerCase();
  fs.copyFileSync(path.join(dir, f), path.join(UPLOADS, `${id}.${ext}`));
  writeJSON(path.join(UPLOADS, `${id}.json`), { name: f, ext, size: fs.statSync(path.join(dir, f)).size, date: new Date().toISOString() });
  return { id, name: motifName(f) };
}
function ensurePresets() {
  if (presetsChecked) return;
  presetsChecked = true;
  try {
    const raw = readJSON<Record<string, string | Mark>>(PRESET_MARK, {});
    let changed = false;
    for (const pr of PRESETS) {
      const dir = path.join(process.cwd(), 'seed', 'motive', pr.slug);
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|svg|webp)$/i.test(f)).sort();
      const list = readJSON<TeamShop[]>(F, []);
      const shop = list.find((t) => t.slug === pr.slug);
      let mark = raw[pr.slug];
      if (typeof mark === 'object' && mark?.deleted) continue; // im Admin gelöscht – nie wieder anlegen oder ergänzen
      // ältere Markierung (nur Datum): bekannt = Dateien, deren Motiv schon im Shop ist
      if (typeof mark === 'string') mark = { at: mark, files: shop ? files.filter((f) => shop.motifs?.some((m) => m.name === motifName(f))) : files };
      fs.mkdirSync(UPLOADS, { recursive: true });
      if (!mark) {
        if (!shop) {
          const items = allProductsBrief().filter((p) => p.categorySlug === 't-shirts').slice(0, 6).map((p) => p.id);
          list.push({ slug: pr.slug, name: pr.name, active: true, logoId: null, logoName: null, items, method: 'Druck', positions: ['Brust mittig'], personalize: 'aus', deadline: null, note: pr.note ?? '', contact: '', motifs: files.map((f) => importMotif(dir, f)), price: null, createdAt: new Date().toISOString() });
          saveTeamShops(list);
        }
        mark = { at: new Date().toISOString(), files };
      } else {
        const fresh = files.filter((f) => !(mark as Mark).files.includes(f));
        if (fresh.length && shop) {
          shop.motifs = [...(shop.motifs ?? []), ...fresh.filter((f) => !shop.motifs?.some((m) => m.name === motifName(f))).map((f) => importMotif(dir, f))].slice(0, 60);
          saveTeamShops(list);
        }
        mark = { ...mark, files: [...new Set([...mark.files, ...fresh])] };
      }
      if (JSON.stringify(raw[pr.slug]) !== JSON.stringify(mark)) { raw[pr.slug] = mark; changed = true; }
    }
    if (changed) writeJSON(PRESET_MARK, raw);
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
      const motif = l.deco?.logoName ? l.deco.logoName.replace(/^Motiv: /, '') : undefined;
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

/** Logos zur Auswahl (Hauptlogo + weitere) – leer, wenn es nur ein Logo gibt */
export function logoChoices(t: TeamShop | null | undefined): TeamMotif[] {
  if (!t?.logos?.length) return [];
  return [...(t.logoId ? [{ id: t.logoId, name: (t.logoName ?? 'Vereinslogo').replace(/\.[^.]+$/, '') }] : []), ...t.logos];
}

/** Team-Shop löschen – vorbelegte Motiv-Shops werden dabei dauerhaft als gelöscht markiert */
export function deleteTeamShop(slug: string) {
  saveTeamShops(listTeamShops().filter((x) => x.slug !== slug));
  if (PRESETS.some((p) => p.slug === slug)) {
    const raw = readJSON<Record<string, unknown>>(PRESET_MARK, {});
    const m = raw[slug];
    raw[slug] = { ...(typeof m === 'object' && m ? m : { at: new Date().toISOString(), files: [] }), deleted: true };
    writeJSON(PRESET_MARK, raw);
  }
}
