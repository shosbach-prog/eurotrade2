import { NextResponse } from 'next/server';

/** Alte Vorschau-Links (bereits geteilt) auf das JPEG umleiten */
export function GET(req: Request, { params }: { params: { slug: string } }) {
  const u = new URL(req.url);
  return NextResponse.redirect(new URL(`/team/${params.slug}/og.jpg${u.search}`, process.env.SHOP_URL ?? u.origin), 301);
}
