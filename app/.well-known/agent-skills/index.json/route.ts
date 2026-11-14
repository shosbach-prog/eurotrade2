import { site } from '@/lib/agent-md';
import { sha256, shopSkill } from '@/lib/agent-skill';

export const dynamic = 'force-dynamic';

/** Agent-Skills-Index (Agent Skills Discovery RFC v0.2.0) */
export function GET() {
  const body = {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [{ name: 'euro-trade-shop', type: 'skill-md', description: 'Markentextilien und Werbeartikel bei euro-trade.com finden, Preise lesen und eine Anfrage mit Druck oder Stick vorbereiten.', url: `${site()}/.well-known/agent-skills/euro-trade-shop/SKILL.md`, digest: `sha256:${sha256(shopSkill())}` }],
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } });
}
