import { previewMode } from '@/lib/access';

export const dynamic = 'force-dynamic';

/** robots.txt mit Content Signals (contentsignals.org) – Standard: Suche und KI-Antworten ja, KI-Training nein.
 *  Anpassen über CONTENT_SIGNAL in der .env, CONTENT_SIGNAL=off entfernt die Zeile (Lighthouse wertet sie als unbekannt → SEO 92 statt 100) */
export function GET() {
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  const env = (process.env.CONTENT_SIGNAL ?? '').trim();
  const signal = env === 'off' ? '' : env || 'search=yes, ai-input=yes, ai-train=no';
  const body = previewMode()
    ? 'User-Agent: *\nDisallow: /\n'
    : `# Suche und KI-Antworten erwünscht, KI-Training nicht – siehe https://contentsignals.org/
User-Agent: *
${signal ? `Content-Signal: ${signal}\n` : ''}Allow: /
Allow: /fuer/
Allow: /aktion/
Allow: /api/bild/
Allow: /api/img
Allow: /druck-stick
Allow: /widerruf
Allow: /garantie
Allow: /ueber-uns
Allow: /p/
Allow: /llms.txt
Allow: /.well-known/
Disallow: /admin
Disallow: /api
Disallow: /angebot
Disallow: /warenkorb
Disallow: /merkliste
Disallow: /zugang

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
