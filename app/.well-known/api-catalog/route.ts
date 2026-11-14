import { site } from '@/lib/agent-md';

export const dynamic = 'force-dynamic';

/** API-Katalog (RFC 9727) – öffentliche, maschinenlesbare Schnittstellen des Shops */
export function GET() {
  const s = site();
  const body = { linkset: [
    { anchor: `${s}/feed/google.xml`, 'service-doc': [{ href: `${s}/llms.txt`, type: 'text/markdown', title: 'Shop-Übersicht für Agenten' }], describedby: [{ href: 'https://support.google.com/merchants/answer/7052112', type: 'text/html', title: 'Google-Merchant-Feed-Format' }] },
    { anchor: `${s}/api/search`, 'service-doc': [{ href: `${s}/.well-known/agent-skills/euro-trade-shop/SKILL.md`, type: 'text/markdown', title: 'Produktsuche: GET /api/search?q=…&limit=…' }] },
    { anchor: `${s}/sitemap.xml`, 'service-doc': [{ href: `${s}/llms.txt`, type: 'text/markdown' }] },
  ] };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/linkset+json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } });
}
