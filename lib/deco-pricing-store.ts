import 'server-only';
import path from 'node:path';
import { DATA, readJSON, writeJSON } from './store';
import { DEFAULT_PRICING, cleanPricing, type DecoPricing } from './deco-pricing';

const FILE = path.join(DATA, 'veredelung.json');
export const getPricing = (): DecoPricing & { isDefault?: boolean } => { const d = readJSON<DecoPricing | null>(FILE, null); return d ? cleanPricing(d) : { ...DEFAULT_PRICING, isDefault: true }; };
export const savePricing = (d: unknown) => { const c = { ...cleanPricing(d), updatedAt: new Date().toISOString() }; writeJSON(FILE, c); return c; };
