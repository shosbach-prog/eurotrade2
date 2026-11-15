import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { Product } from './types';
import { DATA, readJSON, writeJSON } from './store';
import { ARTIKEL, readOverrides, type Override } from './artikel';

/** Eigene Kollektionen (seed/kollektionen/<name>.json) – werden einmalig als ausgeblendete Entwürfe angelegt.
 *  Zuordnung über die Artikelnummer: existiert sie schon (Katalog oder Admin), wird nichts angelegt.
 *  Im Admin gelöschte Artikel kommen nicht wieder (Merkliste data/kollektionen.json). */
const DIR = path.join(process.cwd(), 'seed', 'kollektionen');
const MARK = path.join(DATA, 'kollektionen.json');
type Mark = Record<string, { at: string; angelegt: string[]; vorhanden: string[] }>;
type SeedProduct = Product & { _redaktion?: unknown };
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
      for (const { _redaktion: _r, ...p } of list) {
        const sku = String(p.sku ?? '').toUpperCase();
        if (!sku || !p.id || m.angelegt.includes(sku) || m.vorhanden.includes(sku)) continue;
        if (skus.has(sku) || ov[p.id]) { m.vorhanden.push(sku); changed = true; continue; }
        const { id, ...rest } = p;
        ov[id] = { ...(rest as Override), custom: true, hidden: true, collection: name, updatedAt: new Date().toISOString() } as Override;
        skus.add(sku); m.angelegt.push(sku); changed = true;
      }
      mark[name] = m;
    }
    if (changed) { writeJSON(ARTIKEL, ov); writeJSON(MARK, mark); }
  } catch (e) { console.error('Kollektionen-Import fehlgeschlagen:', e); }
}
