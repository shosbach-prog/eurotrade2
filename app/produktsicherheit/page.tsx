import type { Metadata } from 'next';
import Link from 'next/link';
import { allGpsr } from '@/lib/gpsr';
import { brandCounts } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Produktsicherheit (GPSR) – Herstellerangaben', description: 'Herstellerangaben nach der EU-Produktsicherheitsverordnung (GPSR) für alle Marken bei Euro-Trade.' };
export const dynamic = 'force-dynamic';

/** Herstellerangaben aller Marken im Shop nach Verordnung (EU) 2023/988 (GPSR) */
export default function Produktsicherheit() {
  const brands = [...brandCounts().keys()].sort((a, b) => a.localeCompare(b));
  const g = allGpsr();
  return (
    <div className="legal" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1>Produktsicherheit (GPSR)</h1>
      <p>Nach der EU-Produktsicherheitsverordnung (Verordnung (EU) 2023/988) nennen wir zu jedem Artikel den Hersteller mit Anschrift und Kontakt. Die Angaben stehen auch direkt auf jeder Artikelseite unter „Hersteller & Produktsicherheit“.</p>
      <h2>Händler</h2>
      <p>Euro-Trade · Sebastian Hosbach<br />Seehang 28, 44263 Dortmund<br /><a className="alink" href="mailto:info@euro-trade.com">info@euro-trade.com</a> · <a className="alink" href="tel:+493040719258">030 40719258</a></p>
      <p>Sie haben einen Mangel oder ein Sicherheitsproblem an einem Produkt festgestellt? Schreiben Sie uns mit Artikelnummer und kurzer Beschreibung an <a className="alink" href="mailto:info@euro-trade.com?subject=Produktsicherheit">info@euro-trade.com</a> – wir kümmern uns umgehend und informieren bei Bedarf den Hersteller.</p>
      <h2>Hersteller nach Marke</h2>
      <div className="gpsr-list">
        {brands.map((b) => { const x = g(b); return (
          <div key={b} className="box">
            <b>{b}</b>
            {x ? <p>{x.firma}<br />{x.adresse.join(', ')}<br />{x.kontakt.map((k, n) => <span key={k}>{n > 0 && ' · '}{k.includes('@') ? <a className="alink" href={`mailto:${k}`}>{k}</a> : <a className="alink" href={k.startsWith('http') ? k : `https://${k}`} target="_blank" rel="noreferrer nofollow">{k.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>}</span>)}</p> : <p className="muted">Angaben auf Anfrage</p>}
          </div>
        ); })}
      </div>
      <p className="muted" style={{ fontSize: 13 }}>Quelle der Herstellerangaben: Großhändler L-Shop-Team GmbH, Stand {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}. Mehr zu uns im <Link className="alink" href="/impressum">Impressum</Link>.</p>
    </div>
  );
}
