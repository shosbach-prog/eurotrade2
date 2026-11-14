'use client';
import { useEffect } from 'react';
import { productPath } from '@/lib/format';

/** WebMCP: stellt KI-Agenten im Browser Werkzeuge des Shops bereit (Produktsuche, Seite öffnen).
 *  Nur aktiv, wenn der Browser die API anbietet – sonst passiert nichts. */
type Tool = { name: string; description: string; inputSchema: object; execute: (a: any) => Promise<unknown> };
export default function AgentTools() {
  useEffect(() => {
    const mc = (document as any).modelContext ?? (navigator as any).modelContext;
    if (!mc?.registerTool) return;
    const ctl = new AbortController();
    const text = (v: unknown) => ({ content: [{ type: 'text', text: typeof v === 'string' ? v : JSON.stringify(v) }] });
    const tools: Tool[] = [
      { name: 'produkte_suchen', description: 'Sucht Artikel bei euro-trade.com (Textilien, Werbeartikel). Liefert Name, Marke, Art.-Nr., Nettopreis in EUR und Link.',
        inputSchema: { type: 'object', properties: { suchbegriff: { type: 'string', description: 'z. B. "Hoodie", "Poloshirt Damen", "Softshelljacke"' }, anzahl: { type: 'number', description: 'max. Treffer (1–30)' } }, required: ['suchbegriff'] },
        execute: async ({ suchbegriff, anzahl }) => {
          const r = await fetch(`/api/search?q=${encodeURIComponent(String(suchbegriff ?? '').slice(0, 100))}&limit=${Math.min(30, Math.max(1, Number(anzahl) || 10))}`);
          const d = await r.json();
          return text((d.items ?? []).map((p: any) => ({ name: p.name, marke: p.brand, artnr: p.sku, kategorie: p.category, preis_netto_eur: p.price, link: location.origin + productPath(p) })).concat(d.total > (d.items?.length ?? 0) ? [{ weitere: d.total - d.items.length, suche: `${location.origin}/suche?q=${encodeURIComponent(suchbegriff)}` }] : []));
        } },
      { name: 'seite_als_markdown', description: 'Liefert eine Seite von euro-trade.com (Startseite, Kategorie oder Artikel) als Markdown mit Preisen, Farben und Größen.',
        inputSchema: { type: 'object', properties: { pfad: { type: 'string', description: 'Pfad wie "/t-shirts" oder "/t-shirts/t-shirt-herren-bctm044"; leer = aktuelle Seite' } } },
        execute: async ({ pfad }) => { const p = typeof pfad === 'string' && pfad.startsWith('/') ? pfad : location.pathname; const r = await fetch(p, { headers: { Accept: 'text/markdown' } }); return text(await r.text()); } },
    ];
    for (const t of tools) { try { const x = mc.registerTool(t, { signal: ctl.signal }); x?.catch?.(() => {}); } catch { /* ältere API-Fassung */ } }
    return () => ctl.abort();
  }, []);
  return null;
}
