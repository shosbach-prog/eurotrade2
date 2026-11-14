import { pageMarkdown, site } from '@/lib/agent-md';

export const dynamic = 'force-dynamic';

/** Markdown-Fassung einer Seite (Middleware leitet Anfragen mit Accept: text/markdown hierher) */
export function GET(req: Request) {
  const p = req.headers.get('x-md-path') ?? new URL(req.url).searchParams.get('p') ?? '/';
  const md = pageMarkdown(p.slice(0, 300)) ?? `# euro-trade.com\n\nDiese Seite gibt es nur als HTML: ${site()}${p}\n\nÜbersicht für Agenten: ${site()}/llms.txt\n`;
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'x-markdown-tokens': String(Math.ceil(md.length / 4)), Vary: 'Accept', 'Cache-Control': 'public, max-age=600' } });
}
