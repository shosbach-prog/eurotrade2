import { NextResponse, type NextRequest } from 'next/server';
import { isCategoryUrl, isProductUrl } from '@/lib/format';
import { ACCESS_COOKIE, ADMIN_COOKIE, isAdminToken, previewMode, shopClosed, verifyCodeToken } from '@/lib/access';

// Immer erreichbar: Zugang, Pflichtseiten, Angebots-Links aus der E-Mail, Admin-Login
const PUBLIC = ['/feed', '/seitenuebersicht', '/api/img', '/api/druck', '/api/v1', '/llms.txt', '/.well-known', '/api/md', '/api/paypal', '/api/team-info', '/fuer', '/aktion', '/produktsicherheit', '/api/preisanfrage', '/ueber-uns', '/og.png', '/garantie', '/p', '/picto', '/bewerten', '/api/bewerten', '/widerruf', '/versand', '/newsletter', '/api/newsletter', '/start', '/druck-stick', '/api/zugang-anfrage', '/api/bild', '/api/warenkorb-erinnerung', '/sitemap.xml', '/zugang', '/api/zugang', '/api/login', '/passwort', '/api/passwort', '/registrieren', '/api/registrieren', '/kontakt', '/agb', '/ratgeber', '/api/cron', '/impressum', '/datenschutz', '/angebot', '/api/angebot', '/admin/login', '/api/admin/login', '/icon.svg', '/brands', '/marken', '/team', '/api/angebot', '/rechnung', '/api/rechnung', '/favicon.ico', '/robots.txt'];
// Agenten-Erkennung (RFC 8288): Verweise auf Übersicht, API-Katalog, Skills und Sitemap
const LINK = ['</llms.txt>; rel="describedby"; type="text/markdown"', '</.well-known/api-catalog>; rel="api-catalog"', '</.well-known/agent-skills/index.json>; rel="https://agentskills.io/rel/index"', '</.well-known/ai-catalog.json>; rel="describedby"; type="application/json"', '</sitemap.xml>; rel="sitemap"'].join(', ');

/** Content-Security-Policy mit Nonce je Seitenaufruf: nur eigene, von Next mit dieser Nonce versehene Skripte laufen
 *  (plus was diese nachladen – 'strict-dynamic', z. B. Google Tag/Meta-Pixel nach Einwilligung). Eingeschleuste Skripte laufen nicht. */
function csp(nonce: string) {
  const dev = process.env.NODE_ENV !== 'production';
  return [
    "default-src 'self'",
    // 'unsafe-inline' und https: gelten nur für alte Browser ohne 'strict-dynamic' – moderne ignorieren sie, sobald eine Nonce da ist
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https:${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.google.com https://*.doubleclick.net https://www.facebook.com https://connect.facebook.net${dev ? ' ws:' : ''}`,
    "frame-src 'self' https://www.googletagmanager.com https://td.doubleclick.net https://www.facebook.com",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}
/** Nur HTML-Seiten bekommen die Richtlinie – keine API-Antworten, Dateien oder PDFs */
const isPage = (p: string) => !p.startsWith('/api/') && !p.startsWith('/_next/') && !/\.[a-z0-9]{2,5}$/i.test(p);
const match = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(p + '/'));

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.set('x-path', pathname);
  // Nonce an Next weiterreichen (liest sie aus dem Request-Header und setzt sie an die eigenen Skripte)
  const policy = isPage(pathname) && process.env.CSP !== 'off' ? csp(btoa(crypto.randomUUID())) : null;
  if (policy) headers.set('Content-Security-Policy', policy);
  const secure = <T extends NextResponse>(r: T) => { if (policy) r.headers.set(process.env.CSP === 'report' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', policy); return r; };
  // ?preis=brutto|netto → Preisanzeige sofort umstellen (z. B. Links aus dem Google-Feed)
  const pm = req.nextUrl.searchParams.get('preis');
  const priceMode = pm === 'brutto' || pm === 'netto' ? pm : null;
  if (priceMode) headers.set('cookie', [...(headers.get('cookie') ?? '').split(/;\s*/).filter((c) => c && !c.startsWith('et_price=')), `et_price=${priceMode}`].join('; '));
  const pass = () => {
    const r = NextResponse.next({ request: { headers } });
    if (priceMode) r.cookies.set('et_price', priceMode, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/') && !pathname.startsWith('/admin')) { r.headers.set('Link', LINK); r.headers.set('Vary', 'Accept'); }
    return secure(r);
  };
  // Markdown für Agenten: Accept: text/markdown → Markdown-Fassung von Startseite, Kategorie oder Artikel
  if (!shopClosed() && /text\/markdown/i.test(req.headers.get('accept') ?? '') && (pathname === '/' || isCategoryUrl(pathname) || isProductUrl(pathname))) {
    const url = req.nextUrl.clone(); url.pathname = '/api/md'; url.search = '';
    headers.set('x-md-path', pathname);
    return NextResponse.rewrite(url, { request: { headers } });
  }
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
  if (!previewMode() && (isCategoryUrl(pathname) || isProductUrl(pathname))) {
    headers.set('x-showcase', '1');
    return pass();
  }
  // Startseite ohne Code: öffentliche Landingpage (URL bleibt euro-trade.com/)
  if (pathname === '/') {
    headers.set('x-path', '/start');
    const url = req.nextUrl.clone(); url.pathname = '/start';
    return secure(NextResponse.rewrite(url, { request: { headers } }));
  }
  return deny('/zugang');
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
