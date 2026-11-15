import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Product } from './types';
import { DATA, readJSON, writeJSON } from './store';
import { ARTIKEL, readOverrides, type Override } from './artikel';

/** Eigene Kollektionen mit eigener Seite (/<slug>) – getrennt von Katalogmenü und Team-Shops */
export type Kollektion = { /** interner Name (Feld collection der Artikel, Seed-Datei) */ key: string; slug: string; /** frühere Adressen → Weiterleitung */ aliases?: string[]; name: string; title: string; description: string; intro: string; filter: string; textil: string };
export const KOLLEKTIONEN: Record<string, Kollektion> = {
  satire: {
    key: 'satire',
    slug: 'politik-satire',
    aliases: ['satire'],
    name: 'Satire zum Anziehen',
    title: 'Satire-Kollektion – politische Satire auf T-Shirt und Hoodie',
    description: 'Satiremotive zu Politik, Bürokratie, Wohnen und Alltag – als T-Shirt und Hoodie, fertig bedruckt zum Festpreis inkl. Druck.',
    intro: 'Satiremotive für alle, die Politik und Alltag lieber mit Humor kommentieren – jedes als T-Shirt und als Hoodie, fertig bedruckt zum Festpreis.',
    filter: 'Thema',
    textil: 'Textilart',
  },
};
export const kollektionBySlug = (slug: string) => Object.values(KOLLEKTIONEN).find((k) => k.slug === slug) ?? null;
export const kollektionByAlias = (slug: string) => Object.values(KOLLEKTIONEN).find((k) => k.aliases?.includes(slug)) ?? null;
/** Kollektion eines Artikels (über das Feld collection) */
export const kollektionOf = (name?: string) => (name ? KOLLEKTIONEN[name] ?? null : null);

/** Seed-Dateien (seed/kollektionen/<name>.json) werden einmalig als ausgeblendete Entwürfe angelegt.
 *  Zuordnung über die Artikelnummer: existiert sie schon (Katalog oder Admin), wird nichts angelegt.
 *  Ändert sich der Seed, werden angelegte, im Admin noch nicht bearbeitete Artikel nachgezogen (Sichtbarkeit bleibt).
 *  Im Admin gelöschte Artikel kommen nicht wieder (Merkliste data/kollektionen.json). */
const DIR = path.join(process.cwd(), 'seed', 'kollektionen');
const MARK = path.join(DATA, 'kollektionen.json');
type Mark = Record<string, { at: string; angelegt: string[]; vorhanden: string[]; stand?: Record<string, { hash: string; at: string }> }>;
type SeedProduct = Product & { _redaktion?: unknown };
const hashOf = (x: unknown) => crypto.createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 16);
let checked = false;

export function ensureKollektionen(catalogFile: string) {
  if (checked) return;
  checked = true;
  try {
    if (!fs.existsSync(DIR)) return;
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
    if (!files.length) return;
    const mark = readJSON<Mark>(MARK, {});
    const raw = readJSON<Product[]>(catalogFile, []);
    const ov = readOverrides();
    const skus = new Set([...raw.map((p) => p.sku), ...Object.values(ov).map((o) => o.sku ?? '')].filter(Boolean).map((s) => s.toUpperCase()));
    let changed = false;
    for (const f of files) {
      const name = f.replace(/\.json$/, '');
      const list = readJSON<SeedProduct[]>(path.join(DIR, f), []);
      const m = mark[name] ?? { at: new Date().toISOString(), angelegt: [], vorhanden: [] };
      m.stand ??= {};
      for (const { _redaktion: _r, ...p } of list) {
        const sku = String(p.sku ?? '').toUpperCase();
        if (!sku || !p.id || m.vorhanden.includes(sku)) continue;
        const { id, ...rest } = p;
        const hash = hashOf(rest);
        if (m.angelegt.includes(sku)) {
          // Seed geändert? Nur nachziehen, wenn der Artikel noch existiert und seit dem Import nicht im Admin bearbeitet wurde
          const cur = ov[id]; const st = m.stand[sku];
          if (!cur) continue;
          // ältere Importe ohne Stand: aktuellen Stand als Ausgangspunkt merken (ab jetzt werden Seed-Änderungen nachgezogen)
          if (!st) { m.stand[sku] = { hash, at: cur.updatedAt ?? '' }; changed = true; continue; }
          if (st.hash === hash || cur.updatedAt !== st.at) continue;
          const at = new Date().toISOString();
          ov[id] = { ...(rest as Override), custom: true, hidden: cur.hidden, top: cur.top, sale: cur.sale, collection: name, updatedAt: at } as Override;
          m.stand[sku] = { hash, at }; changed = true;
          continue;
        }
        if (skus.has(sku) || ov[id]) { m.vorhanden.push(sku); changed = true; continue; }
        const at = new Date().toISOString();
        ov[id] = { ...(rest as Override), custom: true, hidden: true, collection: name, updatedAt: at } as Override;
        skus.add(sku); m.angelegt.push(sku); m.stand[sku] = { hash, at }; changed = true;
      }
      mark[name] = m;
    }
    if (changed) { writeJSON(ARTIKEL, ov); writeJSON(MARK, mark); }
  } catch (e) { console.error('Kollektionen-Import fehlgeschlagen:', e); }
}
