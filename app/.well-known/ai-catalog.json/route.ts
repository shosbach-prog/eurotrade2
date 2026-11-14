import { site } from '@/lib/agent-md';

export const dynamic = 'force-dynamic';

/** ARD-Manifest (Agentic Resource Discovery) – was Agenten hier finden */
export function GET() {
  const s = site(); const d = new URL(s).hostname;
  const body = {
    specVersion: '0.1',
    host: { name: 'euro-trade.com', url: s, description: 'Markentextilien und Werbeartikel ab 1 Stück, bedruckt oder bestickt', contact: 'info@euro-trade.com' },
    entries: [
      { id: `urn:air:${d}:shop:overview`, displayName: 'Shop-Übersicht (llms.txt)', type: 'text/markdown', url: `${s}/llms.txt`, representativeQueries: ['T-Shirts mit Logo bedrucken ab 1 Stück', 'Vereinskleidung bestellen', 'Firmenbekleidung besticken lassen'] },
      { id: `urn:air:${d}:shop:product-feed`, displayName: 'Produkt-Feed mit Preisen', type: 'application/rss+xml', url: `${s}/feed/google.xml`, representativeQueries: ['Preis Hoodie mit Druck', 'Poloshirt Firmenlogo Preis', 'Markentextilien Großhandel Preise'] },
      { id: `urn:air:${d}:shop:skill`, displayName: 'Agent-Skill: im Shop suchen und anfragen', type: 'text/markdown', url: `${s}/.well-known/agent-skills/euro-trade-shop/SKILL.md`, representativeQueries: ['Arbeitskleidung mit Stick anfragen', 'Teamshirts für Verein suchen'] },
      { id: `urn:air:${d}:shop:api-catalog`, displayName: 'API-Katalog', type: 'application/linkset+json', url: `${s}/.well-known/api-catalog`, representativeQueries: ['euro-trade Produktsuche API', 'euro-trade Produktfeed'] },
    ],
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } });
}
