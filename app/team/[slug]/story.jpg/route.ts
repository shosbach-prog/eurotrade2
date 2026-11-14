import { getTeamShop } from '@/lib/teamshop';
import { socialImage } from '@/lib/team-social';
import { shopUrl } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Teilen-Kit: Story-Grafik 1080×1920 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const t = getTeamShop(params.slug);
  if (!t) return new Response('Nicht gefunden', { status: 404 });
  const buf = await socialImage(t, 'story', shopUrl());
  return new Response(buf, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=600', 'Content-Disposition': `inline; filename="${t.slug}-story.jpg"` } });
}
