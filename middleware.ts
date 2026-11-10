import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE, ADMIN_COOKIE, isAdminToken, shopClosed, verifyCodeToken } from '@/lib/access';

// Immer erreichbar: Zugang, Pflichtseiten, Angebots-Links aus der E-Mail, Admin-Login
const PUBLIC = ['/zugang', '/api/zugang', '/impressum', '/datenschutz', '/angebot', '/api/angebot', '/admin/login', '/api/admin/login', '/icon.svg', '/favicon.ico', '/robots.txt'];
const match = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(p + '/'));

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.set('x-path', pathname);
  const pass = () => NextResponse.next({ request: { headers } });
  const deny = (to: string) => {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = to;
    url.search = pathname !== '/' ? `?weiter=${encodeURIComponent(pathname + search)}` : '';
    return NextResponse.redirect(url);
  };

  if (match(pathname, PUBLIC)) return pass();
  const admin = await isAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) return admin ? pass() : deny('/admin/login');
  if (!shopClosed() || admin) return pass();
  // Signatur prüfen – ob der Code noch aktiv ist, prüft der Server (Codes können im Admin gesperrt werden)
  if (await verifyCodeToken(req.cookies.get(ACCESS_COOKIE)?.value)) return pass();
  return deny('/zugang');
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
