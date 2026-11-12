import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { Product, PublicProduct } from './types';
import { DATA, readJSON, writeJSON } from './store';
import { buildCopy } from './copy';

/** Verkaufstext je Artikel: Überschrift, Einleitung, Highlights, Einsatzbereiche */
export type ProductText = { headline: string; intro: string; highlights: string[]; idealFor: string; updatedAt?: string };
export type TextSource = 'eigen' | 'vorlage' | 'automatisch';

const EDIT = path.join(DATA, 'texte.json'); // im Admin bearbeitet (Vorrang)
const SEED = path.join(process.cwd(), 'seed', 'texte.json'); // redaktionelle Vorlage im Repo
let cache: { key: string; edit: Record<string, ProductText>; seed: Record<string, ProductText> } | null = null;
function load() {
  const m = (f: string) => (fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0);
  const key = `${m(EDIT)}|${m(SEED)}`;
  if (!cache || cache.key !== key) cache = { key, edit: readJSON(EDIT, {}), seed: readJSON(SEED, {}) };
  return cache;
}


/** Automatischer Verkaufstext aus den Produktdaten (siehe lib/copy.ts) */
export function generateText(p: Product | PublicProduct): ProductText {
  return buildCopy(p);
}

export function getText(p: Product | PublicProduct): { text: ProductText; source: TextSource } {
  const c = load();
  if (c.edit[p.id]) return { text: c.edit[p.id], source: 'eigen' };
  if (c.seed[p.id]) return { text: c.seed[p.id], source: 'vorlage' };
  return { text: generateText(p), source: 'automatisch' };
}
export function saveText(id: string, t: ProductText | null) {
  const all = readJSON<Record<string, ProductText>>(EDIT, {});
  if (t) all[id] = { ...t, updatedAt: new Date().toISOString() }; else delete all[id];
  writeJSON(EDIT, all);
}
export const seedText = (id: string) => load().seed[id] ?? null;
