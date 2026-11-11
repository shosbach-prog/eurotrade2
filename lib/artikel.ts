import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { Product } from './types';
import { DATA, readJSON, writeJSON } from './store';

/** Änderungen aus dem Admin – liegen getrennt vom Katalog, damit Feed-Updates und Deploys sie nicht überschreiben */
export type Override = Partial<Omit<Product, 'id'>> & { hidden?: boolean; top?: boolean; custom?: boolean; updatedAt?: string };
export const ARTIKEL = path.join(DATA, 'artikel.json');
export const overridesMtime = () => (fs.existsSync(ARTIKEL) ? fs.statSync(ARTIKEL).mtimeMs : 0);
export const readOverrides = () => readJSON<Record<string, Override>>(ARTIKEL, {});
export function saveOverride(id: string, o: Override | null) {
  const all = readOverrides();
  if (o && Object.keys(o).length) all[id] = { ...o, updatedAt: new Date().toISOString() }; else delete all[id];
  writeJSON(ARTIKEL, all);
}
