import { llmsTxt } from '@/lib/agent-md';

export const dynamic = 'force-dynamic';
export function GET() {
  return new Response(llmsTxt(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
