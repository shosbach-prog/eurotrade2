import path from 'node:path';
import { NextResponse } from 'next/server';
import { readJSON } from '@/lib/store';
import { SHARED_DIR as DIR, cleanSharedLines, saveSharedCart, type SharedLine } from '@/lib/shared-cart';
import { getProduct } from '@/lib/catalog';
import { viewCtx } from '@/lib/customer';

/** Warenkorb per Link teilen: gespeichert werden nur Artikel, Farbe, Größe, Menge und Veredelung – Preise kommen beim Öffnen frisch aus dem Katalog */
type Shared = { date: string; lines: SharedLine[] };

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const lines = cleanSharedLines(b?.lines);
  if (!lines.length) return NextResponse.json({ error: 'Warenkorb ist leer.' }, { status: 400 });
  const id = saveSharedCart(lines);
  if (!id) return NextResponse.json({ error: 'Warenkorb zu groß zum Teilen.' }, { status: 400 });
  return NextResponse.json({ ok: true, id });
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!/^[a-f0-9]{8,24}$/.test(id)) return NextResponse.json({ error: 'Ungültiger Link.' }, { status: 400 });
  const s = readJSON<Shared | null>(path.join(DIR, `${id}.json`), null);
  if (!s) return NextResponse.json({ error: 'Dieser geteilte Warenkorb existiert nicht mehr.' }, { status: 404 });
  const ctx = await viewCtx();
  const lines = s.lines.flatMap((l) => {
    const p = getProduct(l.id, ctx);
    if (!p || p.locked) return [];
    const col = p.colors.find((c) => c.name === l.color);
    return [{ id: p.id, sku: p.sku, name: p.name, color: l.color, hex: col?.hex, size: l.size, qty: l.sample ? 1 : l.qty, price: p.price, ...(p.sizeUp ? { ups: p.sizeUp } : {}), category: p.category, image: col?.image ?? p.images[0], deco: l.deco ?? null, tiers: p.tiers, sizes: p.sizes, ...(l.sample ? { sample: true } : {}), ...(l.team ? { team: l.team } : {}) }];
  });
  return NextResponse.json({ ok: true, date: s.date, lines, missing: s.lines.length - lines.length });
}
