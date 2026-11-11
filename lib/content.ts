import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { Product, PublicProduct } from './types';
import { DATA, readJSON, writeJSON } from './store';

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

const clean = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim();
const first = (s?: string) => clean(s).split(',')[0];

/** Automatischer Text – ausschließlich aus den Produktdaten, nichts dazuerfunden */
export function generateText(p: Product | PublicProduct): ProductText {
  const f = (p.features ?? []).filter((x) => x.length < 120 && !/möglicherweise|massenbilanz/i.test(x));
  const sp = p.specs ?? {};
  const gsm = clean(p.material).match(/(\d+)\s*g\/m²/)?.[1];
  const mat = clean(p.material).replace(/,?\s*\d+\s*g\/m²/, '').trim();
  const sizes = p.sizes.length > 1 ? `in den Größen ${p.sizes[0]} bis ${p.sizes[p.sizes.length - 1]}` : p.sizes[0] ? `in ${p.sizes[0]}` : '';
  const colors = p.colors.length > 1 ? `${p.colors.length} Farben` : '';
  const facts = [gsm && `${gsm} g/m²`, mat, first(p.composition)].filter(Boolean).join(', ');
  const s1 = `${p.name} von ${p.brand}${facts ? `: ${facts}` : ''}.`;
  const s2 = f.length ? `${f.slice(0, 3).join(', ')}.` : '';
  const s3 = [colors && sizes ? `Erhältlich in ${colors} ${sizes}` : colors ? `Erhältlich in ${colors}` : sizes ? `Erhältlich ${sizes}` : '', sp['Zertifizierung'] && sp['Zertifizierung'] !== 'Keine Angabe' && !f.some((x) => /in arbeit/i.test(x)) ? `Zertifizierung: ${first(sp['Zertifizierung'])}` : ''].filter(Boolean).join(', ');
  const highlights = [
    [gsm && `${gsm} g/m²`, mat, first(p.composition)].filter(Boolean).join(' · '),
    ...f.slice(0, 3),
    colors && sizes ? `${colors}, ${sizes.replace('in den Größen ', 'Größen ')}` : '',
    sp['Veredelung'] && sp['Veredelung'] !== 'Keine Angabe' ? `Geeignet für ${sp['Veredelung']}` : '',
    sp['Pflege'] ? first(sp['Pflege']) : '',
  ].filter(Boolean).slice(0, 5);
  const use = (p.tags ?? []).filter((t) => /beruf|sport|arbeit|freizeit|promotion|alltag/i.test(t));
  return {
    headline: p.name,
    intro: [s1, s2, s3 ? `${s3}.` : ''].filter(Boolean).join(' '),
    highlights,
    idealFor: use.length ? use.join(', ') : `Teamkleidung, Verein, Firma${p.category ? ` – ${p.category}` : ''}`,
  };
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
