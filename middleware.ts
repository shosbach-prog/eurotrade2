import { NextResponse, type NextRequest } from 'next/server';
import { isProductUrl } from '@/lib/format';
import { ACCESS_COOKIE, ADMIN_COOKIE, isAdminToken, previewMode, shopClosed, verifyCodeToken } from '@/lib/access';

// Immer erreichbar: Zugang, Pflichtseiten, Angebots-Links aus der E-Mail, Admin-Login
const PUBLIC = ['/fuer', '/aktion', '/produktsicherheit', '/api/preisanfrage', '/ueber-uns', '/og.png', '/garantie', '/p', '/picto', '/bewerten', '/api/bewerten', '/widerruf', '/newsletter', '/api/newsletter', '/start', '/druck-stick', '/api/zugang-anfrage', '/api/bild', '/api/warenkorb-erinnerung', '/sitemap.xml', '/zugang', '/api/zugang', '/api/login', '/passwort', '/api/passwort', '/registrieren', '/api/registrieren', '/kontakt', '/agb', '/ratgeber', '/api/cron', '/impressum', '/datenschutz', '/angebot', '/api/angebot', '/admin/login', '/api/admin/login', '/icon.svg', '/brands', '/marken', '/team', '/api/angebot', '/rechnung', '/api/rechnung', '/favicon.ico', '/robots.txt'];
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

  if (pathname.startsWith('/team/')) {
    // Team-Shop: Mitglieder dürfen ohne Zugangscode Artikel des Team-Shops anfragen (Cookie merkt sich den Shop)
    const res = pass();
    const slug = pathname.split('/')[2] ?? '';
    if (/^[a-z0-9-]{1,40}$/.test(slug)) res.cookies.set('et_team', slug, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', httpOnly: true });
    return res;
  }
  if (match(pathname, PUBLIC)) return pass();
  const admin = await isAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) return admin ? pass() : deny('/admin/login');
  if (!shopClosed() || admin) return pass();
  // Signatur prüfen – ob der Code noch aktiv ist, prüft der Server (Codes können im Admin gesperrt werden)
  // Vorschau-Modus: Kunden-Codes zählen noch nicht
  if (!previewMode() && (await verifyCodeToken(req.cookies.get(ACCESS_COOKIE)?.value))) return pass();
  // Team-Shop-Mitglieder: Warenkorb, Anfrage und Logo-Upload erlaubt
  if (!previewMode() && req.cookies.get('et_team')?.value && (['/warenkorb', '/api/anfrage', '/api/upload', '/api/ich'].includes(pathname) || pathname.startsWith('/api/upload/'))) {
    headers.set('x-public', '1');
    return pass();
  }
  // Schaufenster: Kategorien und Artikel öffentlich – ohne Preise (nicht im Vorschau-Modus)
  if (!previewMode() && (pathname.startsWith('/kategorie/') || isProductUrl(pathname))) {
    headers.set('x-showcase', '1');
    return pass();
  }
  // Startseite ohne Code: öffentliche Landingpage (URL bleibt euro-trade.com/)
  if (pathname === '/') {
    headers.set('x-path', '/start');
    const url = req.nextUrl.clone(); url.pathname = '/start';
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return deny('/zugang');
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
