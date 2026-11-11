import Link from 'next/link';
import type { Metadata } from 'next';
import { GUIDES } from '@/lib/ratgeber';
import JsonLd, { crumbSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Ratgeber Textilveredelung & Teamkleidung',
  description: 'Druck oder Stick, Logo-Datei, Grammatur, Teamkleidung und Arbeitskleidung: praktische Ratgeber rund um Textilien mit Logo.',
  alternates: { canonical: '/ratgeber' },
};

export default function Ratgeber() {
  return (
    <div className="info">
      <JsonLd data={crumbSchema([['Start', '/'], ['Ratgeber', '/ratgeber']])} />
      <div className="crumbs"><Link href="/">Start</Link> › Ratgeber</div>
      <h1>Ratgeber: Textilien mit Logo</h1>
      <p className="lead">Kurz, praktisch und ohne Fachchinesisch: Hier erklären wir, worauf es bei Teamkleidung, Firmenbekleidung und Veredelung ankommt.</p>
      <div className="rg-grid">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/ratgeber/${g.slug}`} className="rg-card">
            <span className="rg-ico" aria-hidden>{g.icon}</span>
            <h2>{g.title}</h2>
            <p>{g.teaser}</p>
            <span className="rg-meta">{g.minutes} Min. Lesezeit · Weiterlesen →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
