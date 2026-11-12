import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { adminProduct } from '@/lib/catalog';
import { randomId } from '@/lib/store';
import { readOverrides, saveOverride, type Override } from '@/lib/artikel';
import type { Color, Product } from '@/lib/types';

const str = (v: unknown, max = 200) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);
const list = (v: unknown, max = 60) => (Array.isArray(v) ? v : []).map((x) => str(x, 300)).filter(Boolean).slice(0, max);
const num = (v: unknown) => { const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null; };
const img = (s: string) => /^(\/p\/|\/api\/bild\/[a-f0-9]{24}$|https:\/\/)/.test(s);

/** Formulardaten prüfen und in Produktfelder übersetzen */
function clean(d: Record<string, unknown>): Partial<Product> {
  const colors: Color[] = (Array.isArray(d.colors) ? d.colors : []).slice(0, 80).map((c: Record<string, unknown>) => ({
    ...(c as Color),
    name: str(c?.name, 60),
    hex: /^#[0-9a-f]{6}$/i.test(String(c?.hex)) ? String(c.hex) : undefined,
    image: c?.image && img(String(c.image)) ? String(c.image) : undefined,
  })).filter((c) => c.name);
  const tiers = (Array.isArray(d.baseTiers) ? d.baseTiers : []).map((t: { min?: unknown; price?: unknown }) => ({ min: Math.floor(Number(t?.min)), price: num(t?.price) }))
    .filter((t): t is { min: number; price: number } => t.min > 1 && t.price != null).sort((a, b) => a.min - b.min).slice(0, 10);
  const specs: Record<string, string> = {};
  for (const [k, v] of Object.entries((d.specs as Record<string, unknown>) ?? {}).slice(0, 30)) if (str(k, 60) && str(v, 300)) specs[str(k, 60)] = str(v, 300);
  return {
    hidden: !!d.hidden, top: !!d.top,
    sku: str(d.sku, 40), name: str(d.name, 120), brand: str(d.brand, 60), category: str(d.category, 60) || 'Sonstiges',
    basePrice: num(d.basePrice), baseTiers: tiers,
    description: str(d.description, 20000), material: str(d.material, 200), composition: str(d.composition, 200), gender: str(d.gender, 40),
    features: list(d.features, 20), tags: list(d.tags, 20), pairs: list(d.pairs, 12).map((s) => s.toUpperCase().slice(0, 40)), sizes: list(d.sizes, 30).map((s) => s.slice(0, 40)),
    images: list(d.images, 30).filter(img), colors, specs, sizeChart: str(d.sizeChart, 400) || undefined,
  };
}
const norm = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== '' && x != null)) : v);
const same = (a: unknown, b: unknown) => JSON.stringify(norm(a) ?? null) === JSON.stringify(norm(b) ?? null) || ((a === '' || (Array.isArray(a) && !a.length) || a === false) && (b == null || b === '' || (Array.isArray(b) && !b.length) || b === false));

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const { id, data } = await req.json().catch(() => ({}));
  const { p, original } = adminProduct(String(id));
  if (!p) return NextResponse.json({ error: 'Artikel nicht gefunden.' }, { status: 404 });
  const c = clean(data ?? {});
  if (!c.name || !c.sku) return NextResponse.json({ error: 'Name und Artikelnummer sind Pflicht.' }, { status: 400 });
  if (original) {
    // Nur Abweichungen vom Katalog speichern – so kommen spätere Feed-Updates (z. B. neue Farben) weiter durch
    const o: Override = {};
    for (const [k, v] of Object.entries(c)) if (!same(v, (original as Record<string, unknown>)[k])) (o as Record<string, unknown>)[k] = v;
    saveOverride(p.id, o);
  } else saveOverride(p.id, { ...c, custom: true } as Override);
  return NextResponse.json({ ok: true });
}

/** Neuen Artikel anlegen */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const d = await req.json().catch(() => ({}));
  const name = str(d.name, 120), sku = str(d.sku, 40), category = str(d.category, 60) || 'Sonstiges';
  if (!name || !sku) return NextResponse.json({ error: 'Name und Artikelnummer sind Pflicht.' }, { status: 400 });
  const id = `a-${randomId(4)}`;
  saveOverride(id, { custom: true, hidden: true, name, sku, category, brand: str(d.brand, 60), basePrice: null, images: [], colors: [], sizes: [], description: '' });
  return NextResponse.json({ ok: true, id });
}

/** Eigene Änderungen verwerfen bzw. selbst angelegten Artikel löschen */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!readOverrides()[id]) return NextResponse.json({ error: 'Keine Änderungen vorhanden.' }, { status: 404 });
  saveOverride(id, null);
  return NextResponse.json({ ok: true });
}

/** Mehrere Artikel auf einmal: sichtbar/ausblenden, Kategorie, Top */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const ids: string[] = (Array.isArray(b?.ids) ? b.ids : []).map(String).slice(0, 5000);
  const patch: Override = {};
  if (typeof b?.patch?.hidden === 'boolean') patch.hidden = b.patch.hidden;
  if (typeof b?.patch?.top === 'boolean') patch.top = b.patch.top;
  // Sonderangebot: { pct } setzen, null = entfernen
  const saleOff = b?.patch && 'sale' in b.patch && b.patch.sale === null;
  if (b?.patch?.sale && typeof b.patch.sale.pct === 'number') patch.sale = { pct: Math.max(0, Math.min(80, Math.round(b.patch.sale.pct))) };
  if (typeof b?.patch?.category === 'string' && str(b.patch.category, 60)) patch.category = str(b.patch.category, 60);
  if (!ids.length || (!Object.keys(patch).length && !saleOff)) return NextResponse.json({ error: 'Nichts zu ändern.' }, { status: 400 });
  const all = readOverrides();
  let n = 0;
  for (const id of ids) {
    const { p } = adminProduct(id);
    if (!p) continue;
    const next = { ...(all[id] ?? {}), ...patch };
    if (saleOff) delete next.sale;
    saveOverride(id, next);
    n++;
  }
  return NextResponse.json({ ok: true, count: n });
}
