import { shopSkill } from '@/lib/agent-skill';

export const dynamic = 'force-dynamic';
export function GET() {
  return new Response(shopSkill(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } });
}
