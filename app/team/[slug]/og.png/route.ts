import { NextResponse } from 'next/server';

/** Alte Vorschau-Links (bereits geteilt) auf das JPEG umleiten */
export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const u = new URL(req.url);
  return NextResponse.redirect(new URL(`/team/${params.slug}/og.jpg${u.search}`, process.env.SHOP_URL ?? u.origin), 301);
}
