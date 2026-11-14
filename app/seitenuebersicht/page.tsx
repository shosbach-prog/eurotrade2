import Link from 'next/link';
import { sitemapEntries } from '@/lib/sitemap-data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Seitenübersicht', description: 'Alle Seiten von euro-trade.com auf einen Blick: Kategorien, Marken, Ratgeber, Team-Shops und Service.', alternates: { canonical: '/seitenuebersicht' } };

/** HTML-Sitemap für Besucher und Suchmaschinen */
export default function Seitenuebersicht() {
  const groups = new Map<string, { path: string; title: string }[]>();
  for (const e of sitemapEntries()) { if (e.path === '/' || e.group.startsWith('Artikel')) continue; const g = e.group; groups.set(g, [...(groups.get(g) ?? []), { path: e.path, title: e.title }]); }
  const order = (g: string) => (['Kategorien', 'Marken', 'Motiv- & Team-Shops', 'Zielgruppen & Aktionen', 'Ratgeber', 'Allgemein', 'Rechtliches'].indexOf(g));
  const list = [...groups.entries()].sort((a, b) => order(a[0]) - order(b[0]) || a[0].localeCompare(b[0], 'de'));
  return (
    <div className="legal sitemap-page">
      <div className="crumbs"><Link href="/">Startseite</Link> › Seitenübersicht</div>
      <h1>Seitenübersicht</h1>
      <p className="muted">Alle Artikel finden Sie in den Kategorien und über die Suche. Für Suchmaschinen: <a href="/sitemap.xml">sitemap.xml</a></p>
      {list.map(([g, items]) => (
        <section key={g}>
          <h2>{g} <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>({items.length})</span></h2>
          <ul className="sm-list">{items.sort((a, b) => a.title.localeCompare(b.title, 'de')).map((x) => <li key={x.path}><Link href={x.path}>{x.title}</Link></li>)}</ul>
        </section>
      ))}
    </div>
  );
}
