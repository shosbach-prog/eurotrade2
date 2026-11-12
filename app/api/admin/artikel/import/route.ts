import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { adminProducts } from '@/lib/catalog';
import { readOverrides, saveOverride } from '@/lib/artikel';
import { parseCsv, toCsv } from '@/lib/csv';
import { readXlsx } from '@/lib/xlsx';
import { auslauf, buildAuslauf, saveAuslauf } from '@/lib/auslauf';

const COLS = ['id', 'artikelnummer', 'name', 'marke', 'kategorie', 'beschreibung', 'merkmale', 'material', 'zusammensetzung', 'schnitt', 'ek_preis', 'staffel', 'groessen'] as const;
const num = (v: string) => { const n = Number(String(v).replace(/\s|€/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null; };

/** Vorlage: alle (oder nur Platzhalter-)Artikel als CSV für Excel */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response('Nicht angemeldet', { status: 401 });
  const only = new URL(req.url).searchParams.get('nur');
  const list = adminProducts().filter((p) => only !== 'platzhalter' || (p.tags ?? []).includes('Platzhalter'));
  const rows = [COLS as unknown as string[], ...list.map((p) => [p.id, p.sku, p.name, p.brand, p.category, (p.tags ?? []).includes('Platzhalter') ? '' : p.description, (p.features ?? []).join(' | '), p.material, p.composition, p.gender, p.basePrice != null ? String(p.basePrice).replace('.', ',') : '', (p.baseTiers ?? []).map((t) => `${t.min}:${String(t.price).replace('.', ',')}`).join(' '), p.sizes.join(' ')])];
  return new Response(toCsv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="artikel-${only === 'platzhalter' ? 'platzhalter' : 'alle'}.csv"` } });
}

/** CSV einspielen: leere Zellen bleiben unverändert. dry=1 → nur Vorschau */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  // Datei direkt (Excel .xlsx oder CSV) per Formular – oder CSV-Text als JSON (ältere Version)
  let rows: string[][] = [], dry = false, fname = '';
  try {
    if ((req.headers.get('content-type') ?? '').includes('multipart/form-data')) {
      const fd = await req.formData(); const f = fd.get('file');
      dry = fd.get('dry') === '1';
      if (!(f instanceof File)) return NextResponse.json({ error: 'Keine Datei erhalten.' }, { status: 400 });
      fname = f.name; const buf = Buffer.from(await f.arrayBuffer());
      if (/\.xlsx$/i.test(f.name) || buf.subarray(0, 2).toString() === 'PK') rows = readXlsx(buf);
      else if (/\.xls$/i.test(f.name)) return NextResponse.json({ error: 'Altes Excel-Format (.xls) – bitte in Excel als „Excel-Arbeitsmappe (.xlsx)“ speichern.' }, { status: 400 });
      else { const u = buf.toString('utf8'); rows = parseCsv(u.includes('\uFFFD') ? buf.toString('latin1') : u); }
    } else { const b = await req.json().catch(() => ({})); rows = parseCsv(String(b.csv ?? '')); dry = !!b.dry; }
  } catch (e) { return NextResponse.json({ error: `Datei konnte nicht gelesen werden: ${(e as Error).message}` }, { status: 400 }); }
  if (rows.length < 2) return NextResponse.json({ error: 'Die Datei enthält keine Daten.' }, { status: 400 });
  // L-Shop-Auslaufliste erkannt → Auslaufdaten aktualisieren
  if (rows[0].some((h) => /auslaufdatum/i.test(h))) {
    const stand = /(\d{2}\.\d{2}\.\d{4})/.exec(fname)?.[1] ?? new Date().toLocaleDateString('de-DE');
    const res = buildAuslauf(rows, adminProducts(), stand);
    if (!res) return NextResponse.json({ error: 'Auslaufliste erkannt, aber Spalten „Masterartikel“, „Farbe“ oder „Auslaufdatum“ fehlen.' }, { status: 400 });
    const v = Object.values(res.items), before = Object.keys(auslauf().items).length;
    if (!dry) saveAuslauf(res);
    return NextResponse.json({ ok: true, kind: 'auslauf', dry, rows: rows.length - 1, articles: v.length, complete: v.filter((x) => x.all).length, colors: v.reduce((s, x) => s + Object.keys(x.colors).length, 0), before, stand });
  }
  const head = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ''));
  const col = (name: string) => head.indexOf(name);
  if (col('id') < 0 && col('artikelnummer') < 0) return NextResponse.json({ error: 'Spalte „id“ oder „artikelnummer“ fehlt – bitte die Vorlage verwenden.' }, { status: 400 });
  const all = adminProducts(); const byId = new Map(all.map((p) => [p.id, p])); const bySku = new Map(all.map((p) => [p.sku.toUpperCase(), p]));
  const ov = readOverrides();
  const changes: { id: string; sku: string; fields: string[] }[] = []; const unknown: string[] = [];
  for (const r of rows.slice(1)) {
    const get = (n: string) => (col(n) >= 0 ? (r[col(n)] ?? '').trim() : '');
    const p = byId.get(get('id')) ?? bySku.get(get('artikelnummer').toUpperCase());
    if (!p) { unknown.push(get('artikelnummer') || get('id')); continue; }
    const patch: Record<string, unknown> = {}; const f: string[] = [];
    const set = (k: string, v: unknown, label: string) => { if (JSON.stringify(v) === JSON.stringify((p as Record<string, unknown>)[k] ?? (Array.isArray(v) ? [] : ''))) return; patch[k] = v; f.push(label); };
    if (get('name') && get('name') !== p.name) set('name', get('name').slice(0, 120), 'Name');
    if (get('marke') && get('marke') !== p.brand) set('brand', get('marke').slice(0, 60), 'Marke');
    if (get('kategorie') && get('kategorie') !== p.category) set('category', get('kategorie').slice(0, 60), 'Kategorie');
    if (get('beschreibung')) set('description', get('beschreibung').slice(0, 20000), 'Beschreibung');
    if (get('merkmale')) set('features', get('merkmale').split(/\s*[|\n]\s*/).filter(Boolean).slice(0, 20), 'Merkmale');
    if (get('material')) set('material', get('material').slice(0, 200), 'Material');
    if (get('zusammensetzung')) set('composition', get('zusammensetzung').slice(0, 200), 'Zusammensetzung');
    if (get('schnitt')) set('gender', get('schnitt').slice(0, 40), 'Schnitt');
    if (get('ek_preis') && num(get('ek_preis')) !== p.basePrice) set('basePrice', num(get('ek_preis')), 'EK-Preis');
    if (get('staffel')) set('baseTiers', get('staffel').split(/\s+/).map((x) => x.split(':')).map(([m, pr]) => ({ min: Math.floor(Number(m)), price: num(pr ?? '') })).filter((t) => t.min > 1 && t.price != null).slice(0, 10), 'Staffel');
    if (get('groessen')) set('sizes', get('groessen').split(/[\s,;/]+/).filter(Boolean).slice(0, 30), 'Größen');
    // echte Daten → Platzhalter-Kennzeichen entfernen
    if ((patch.description || patch.basePrice) && (p.tags ?? []).includes('Platzhalter')) { patch.tags = (p.tags ?? []).filter((t) => t !== 'Platzhalter'); f.push('Platzhalter entfernt'); }
    if (!f.length) continue;
    changes.push({ id: p.id, sku: p.sku, fields: f });
    if (!dry) saveOverride(p.id, { ...(ov[p.id] ?? {}), ...patch });
  }
  return NextResponse.json({ ok: true, dry: !!dry, changed: changes.length, changes: changes.slice(0, 400), unknown: unknown.slice(0, 50) });
}
