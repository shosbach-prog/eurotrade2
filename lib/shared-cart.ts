import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { DATA, randomId, writeJSON } from './store';

export const SHARED_DIR = path.join(DATA, 'shared-carts');
export type SharedLine = { id: string; color?: string; size?: string; qty: number; deco?: unknown; sample?: boolean; team?: string };

/** Warenkorb-Positionen aus dem Browser prüfen – nur Artikel, Farbe, Größe, Menge, Veredelung */
export function cleanSharedLines(raw: unknown): SharedLine[] {
  return (Array.isArray(raw) ? raw.slice(0, 200) : []).filter((l: any) => typeof l?.id === 'string' && l.id.length < 80).map((l: any) => ({
    id: l.id, color: typeof l.color === 'string' ? l.color.slice(0, 80) : undefined, size: typeof l.size === 'string' ? l.size.slice(0, 20) : undefined,
    qty: Math.max(1, Math.min(99999, Math.floor(Number(l.qty)) || 1)), deco: l.deco && typeof l.deco === 'object' ? l.deco : null, sample: !!l.sample, team: typeof l.team === 'string' ? l.team.slice(0, 60) : undefined,
  }));
}
/** speichert und liefert die ID für /warenkorb?teilen=… (null = zu groß) */
export function saveSharedCart(lines: SharedLine[]): string | null {
  if (!lines.length || JSON.stringify(lines).length > 200_000) return null;
  fs.mkdirSync(SHARED_DIR, { recursive: true });
  const id = randomId(8);
  writeJSON(path.join(SHARED_DIR, `${id}.json`), { date: new Date().toISOString(), lines });
  return id;
}
