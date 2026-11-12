import 'server-only';
import path from 'node:path';
import { DATA, readJSON, writeJSON } from './store';

/** Suchbegriffe ohne Treffer (für den Admin) – nur der Begriff, keine personenbezogenen Daten */
const FILE = path.join(DATA, 'suche-ohne-treffer.json');
type Entry = { n: number; first: string; last: string };
const norm = (q: string) => q.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 60);

export function logMiss(q: string) {
  const t = norm(q);
  if (t.length < 3 || /^[\d\s]+$/.test(t)) return;
  try {
    const all = readJSON<Record<string, Entry>>(FILE, {});
    const now = new Date().toISOString();
    const e = all[t] ?? { n: 0, first: now, last: now };
    e.n++; e.last = now; all[t] = e;
    // nicht unbegrenzt wachsen lassen
    const keys = Object.keys(all);
    if (keys.length > 500) keys.sort((a, b) => all[a].last.localeCompare(all[b].last)).slice(0, keys.length - 500).forEach((k) => delete all[k]);
    writeJSON(FILE, all);
  } catch { /* Protokoll ist optional */ }
}
export const listMisses = () => Object.entries(readJSON<Record<string, Entry>>(FILE, {})).map(([q, e]) => ({ q, ...e })).sort((a, b) => b.n - a.n || b.last.localeCompare(a.last));
export function clearMiss(q?: string) {
  if (!q) { writeJSON(FILE, {}); return; }
  const all = readJSON<Record<string, Entry>>(FILE, {}); delete all[norm(q)]; writeJSON(FILE, all);
}
