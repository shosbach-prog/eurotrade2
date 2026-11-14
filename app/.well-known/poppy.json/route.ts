import { site } from '@/lib/agent-md';

export const dynamic = 'force-dynamic';

/** Personal Agent Protocol (Poppy) – reine Website-Erklärung ohne Agenten-Login (web: {}, kein auth) */
export function GET() {
  const domain = new URL(site()).hostname.replace(/^www\./, '');
  const body = { protocol_version: '0.1', organization: { name: 'euro-trade.com', domain }, web: {} };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } });
}
