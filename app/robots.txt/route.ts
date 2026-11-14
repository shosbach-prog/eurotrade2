import { previewMode } from '@/lib/access';

export const dynamic = 'force-dynamic';

/** robots.txt – optional mit Content Signals (contentsignals.org) über CONTENT_SIGNAL in der .env,
 *  z. B. CONTENT_SIGNAL=search=yes, ai-input=yes, ai-train=no (Achtung: Lighthouse wertet die Zeile als unbekannt → SEO 92 statt 100) */
export function GET() {
  const base = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  const signal = (process.env.CONTENT_SIGNAL ?? '').trim();
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
