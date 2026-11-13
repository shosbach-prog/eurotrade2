import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { listTeamShops } from '@/lib/teamshop';
import { listInquiries, readJSON, UPLOADS } from '@/lib/store';
import { zip } from '@/lib/zip';

export const dynamic = 'force-dynamic';

/** Druckpaket einer Sammelbestellung: alle verwendeten Motive/Logos in Originalauflösung + Druckliste (CSV) */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const slug = new URL(req.url).searchParams.get('slug') ?? '';
  const t = listTeamShops().find((x) => x.slug === slug);
  if (!t) return NextResponse.json({ error: 'Shop nicht gefunden.' }, { status: 404 });
  const inqs = listInquiries().filter((i) => i.team === slug && i.status !== 'abgelehnt');
  const clean = (s: string) => s.replace(/^Motiv: /, '').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Motiv';
  const used = new Map<string, string>(); // Upload-ID -> Name
  const rows: string[][] = [];
  const perMotif = new Map<string, { pos: string; name: string; qty: number; sizes: Record<string, number> }>();
  for (const i of inqs) for (const l of i.lines) {
    const d = l.deco; if (!d) continue;
    for (const pos of d.positions) {
      const lg = d.logos?.[pos] ?? (d.logoId ? { id: d.logoId, name: d.logoName ?? 'Logo' } : null);
      if (!lg) continue;
      const name = clean(lg.name);
      used.set(lg.id, name);
      rows.push([i.no, i.customer.name, l.sku, l.name, l.color, l.size, String(l.qty), pos, name, d.sizes?.[pos] ? `${d.sizes[pos]} cm` : '', d.method, i.status ?? 'neu']);
      const k = `${pos}|${name}`;
      const e = perMotif.get(k) ?? { pos, name, qty: 0, sizes: {} };
      e.qty += l.qty; e.sizes[`${l.color} ${l.size}`.trim()] = (e.sizes[`${l.color} ${l.size}`.trim()] ?? 0) + l.qty; perMotif.set(k, e);
    }
  }
  if (!rows.length) return NextResponse.json({ error: 'Noch keine Bestellungen mit Motiv/Logo.' }, { status: 404 });
  const csv = (r: string[][]) => Buffer.from('﻿' + r.map((x) => x.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n'), 'utf8');
  const files: { name: string; data: Buffer }[] = [];
  files.push({ name: 'Druckliste.csv', data: csv([['Anfrage', 'Name', 'Art.-Nr.', 'Artikel', 'Farbe', 'Größe', 'Stück', 'Position', 'Motiv/Logo', 'Breite', 'Verfahren', 'Status'], ...rows]) });
  files.push({ name: 'Summen je Motiv.csv', data: csv([['Position', 'Motiv/Logo', 'Stück gesamt', 'Farbe/Größe'], ...[...perMotif.values()].sort((a, b) => b.qty - a.qty).map((m) => [m.pos, m.name, String(m.qty), Object.entries(m.sizes).map(([s, n]) => `${s}: ${n}`).join(', ')])]) });
  const taken = new Set<string>();
  for (const [id, name] of used) {
    const meta = readJSON<{ ext: string } | null>(path.join(UPLOADS, `${id}.json`), null);
    const f = meta && path.join(UPLOADS, `${id}.${meta.ext}`);
    if (!meta || !f || !fs.existsSync(f)) continue;
    let fn = `Motive/${name}.${meta.ext}`; let n = 2; while (taken.has(fn)) fn = `Motive/${name} (${n++}).${meta.ext}`;
    taken.add(fn); files.push({ name: fn, data: fs.readFileSync(f) });
  }
  return new Response(zip(files), { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="druckpaket-${slug}-${new Date().toISOString().slice(0, 10)}.zip"`, 'Cache-Control': 'no-store' } });
}
