import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE, accessEnabled, codeForToken } from '@/lib/access';

// Diese Seiten bleiben immer erreichbar (Impressum/Datenschutz sind Pflicht)
const PUBLIC = ['/zugang', '/api/zugang', '/impressum', '/datenschutz', '/icon.svg', '/favicon.ico', '/robots.txt'];

export async function middleware(req: NextRequest) {
  if (!accessEnabled()) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();
  if (await codeForToken(req.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Bitte zuerst mit Ihrem Zugangscode anmelden.' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/zugang';
  url.search = pathname !== '/' ? `?weiter=${encodeURIComponent(pathname + search)}` : '';
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
