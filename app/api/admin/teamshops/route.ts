import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { METHODS, POSITIONS } from '@/lib/deco';
import { listTeamShops, saveTeamShops, teamSlug, type TeamShop } from '@/lib/teamshop';
import { getProduct } from '@/lib/catalog';

const str = (v: unknown, n = 200) => String(v ?? '').trim().slice(0, n);
function clean(d: any, old?: TeamShop): TeamShop {
  return {
    slug: old?.slug ?? (teamSlug(str(d.slug) || str(d.name)) || `team-${Date.now().toString(36)}`),
    name: str(d.name, 80) || 'Team-Shop', active: d.active !== false,
    logoId: /^[a-f0-9]{24}$/.test(String(d.logoId ?? '')) ? String(d.logoId) : null, logoName: str(d.logoName, 120) || null,
    items: [...new Set<string>((Array.isArray(d.items) ? d.items : []).map(String))].filter((id) => !!getProduct(id, null)).slice(0, 80),
    method: METHODS.includes(d.method) ? d.method : 'Stick',
    positions: (Array.isArray(d.positions) ? d.positions : []).filter((x: string) => POSITIONS.includes(x)).slice(0, 4),
    personalize: ['aus', 'name', 'nummer', 'beides'].includes(d.personalize) ? d.personalize : 'aus',
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(d.deadline ?? '')) ? String(d.deadline) : null,
    note: str(d.note, 1000), contact: str(d.contact, 120), color: /^#[0-9a-f]{6}$/i.test(String(d.color ?? '')) ? String(d.color) : undefined,
    createdAt: old?.createdAt ?? new Date().toISOString(),
  };
}
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const d = await req.json().catch(() => ({}));
  const list = listTeamShops();
  const t = clean(d);
  if (list.some((x) => x.slug === t.slug)) t.slug = `${t.slug}-${Math.random().toString(36).slice(2, 5)}`;
  saveTeamShops([...list, t]);
  return NextResponse.json({ ok: true, shop: t });
}
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const d = await req.json().catch(() => ({}));
  const list = listTeamShops();
  const k = list.findIndex((x) => x.slug === d.slug);
  if (k < 0) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 });
  list[k] = clean(d, list[k]);
  saveTeamShops(list);
  return NextResponse.json({ ok: true, shop: list[k] });
}
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const slug = new URL(req.url).searchParams.get('slug');
  saveTeamShops(listTeamShops().filter((x) => x.slug !== slug));
  return NextResponse.json({ ok: true });
}
