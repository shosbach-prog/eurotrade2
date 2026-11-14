import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd, { crumbSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Über uns',
  description: 'euro-trade.com aus Dortmund: Teamwear und Firmenbekleidung mit Logo für Vereine, Unternehmen und Handwerk – persönlich betreut von Sebastian Hosbach.',
  alternates: { canonical: '/ueber-uns' },
};

export default function UeberUns() {
  return (
    <div className="info">
      <JsonLd data={crumbSchema([['Start', '/'], ['Über uns', '/ueber-uns']])} />
      <div className="crumbs"><Link href="/">Startseite</Link> › Über uns</div>
      <h1>Über euro-trade.com</h1>
      <p className="lead">Wir bringen Ihr Logo auf hochwertige Markentextilien: für Vereine, Unternehmen, Handwerksbetriebe und Teams. Schon ab einem Stück, mit persönlicher Beratung und einem klaren Angebot, bevor Sie sich entscheiden.</p>

      <div className="about">
        <div className="box about-card">
          <span className="avatar big" aria-hidden>SH</span>
          <div>
            <h2 style={{ margin: 0 }}>Sebastian Hosbach</h2>
            <p className="muted" style={{ margin: '2px 0 10px' }}>Inhaber · Dortmund</p>
            <p>Hinter euro-trade.com stehe ich persönlich. Mit über 20 Jahren Erfahrung im B2B-Vertrieb weiß ich, worauf es Firmen und Vereinen ankommt: verlässliche Qualität, ehrliche Beratung und Termine, die gehalten werden.</p>
            <p>Deshalb gibt es bei uns kein anonymes Ticketsystem. Sie haben einen festen Ansprechpartner, der Ihr Projekt von der ersten Anfrage bis zur Lieferung begleitet.</p>
            <p><a className="alink" href="tel:+493040719258">030 40719258</a> · <a className="alink" href="mailto:info@euro-trade.com">info@euro-trade.com</a></p>
          </div>
        </div>
      </div>

      <h2>So arbeiten wir</h2>
      <div className="ret-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="box ret"><div className="ret-ico">1</div><h3>Ehrliche Beratung</h3><p>Wir empfehlen das Verfahren, das zu Ihrem Logo und Budget passt, nicht das teuerste.</p></div>
        <div className="box ret"><div className="ret-ico">2</div><h3>Transparente Angebote</h3><p>Alle Kosten stehen im Angebot: Textil, Veredelung, Einrichtung, Versand. Keine Überraschungen.</p></div>
        <div className="box ret"><div className="ret-ico">3</div><h3>Freigabe vor Produktion</h3><p>Sie sehen Ihr Motiv vorab und geben es frei. Erst dann wird produziert.</p></div>
      </div>

      <div className="box l-cta-box">
        <div><h2 style={{ margin: 0 }}>Lassen Sie uns über Ihr Projekt sprechen</h2><p className="muted" style={{ margin: '4px 0 0' }}>Wir melden uns innerhalb von 24 Stunden.</p></div>
        <Link href="/#anfragen" className="btn" style={{ display: 'inline-grid', placeItems: 'center' }}>Zugang anfragen</Link>
      </div>
    </div>
  );
}
