import Link from 'next/link';
import type { Metadata } from 'next';
import AccessForm from '../zugang/AccessForm';
import RequestForm from './RequestForm';
import NewsletterBox from './NewsletterBox';
import { ReviewStrip } from '@/components/ProductReviews';
import { latestReviews, overall } from '@/lib/reviews';
import { discountTiers, listReferences } from '@/lib/store';
import { categoryTiles, getCategories, getFeatured } from '@/lib/catalog';
import CategoryTiles from '@/components/CategoryTiles';
import QuoteForm from './QuoteForm';
import { ZIELGRUPPEN } from '@/lib/zielgruppen';
import ProductCard from '@/components/ProductCard';
import { previewMode } from '@/lib/access';
import HeroProducts from '@/components/HeroProducts';
import { heroItems } from '@/lib/hero';

export const metadata: Metadata = {
  title: 'Teamwear & Firmenbekleidung mit Logo – ab 1 Stück',
  description: 'Markentextilien für Vereine, Unternehmen und Handwerk – bedruckt oder bestickt, schon ab 1 Stück. Persönlicher Shop mit Ihren Konditionen, Angebot in 24 Stunden.',
  alternates: { canonical: '/' },
};

const BRANDS = ['Asquith & Fox', 'B&C', 'Beechfield', 'Daiber', 'HRM', 'Mantis', 'Marvelis', 'Result', 'Tee Jays', 'TriDri®', 'Onna by Premier', 'ARTG'];

export default function Start() {
  const refs = listReferences();
  const cats = getCategories();
  const tiles = categoryTiles().slice(0, 8);
  const showcase = getFeatured(8, { locked: true });
  const hero = heroItems(showcase, { link: !previewMode() });
  return (
    <div className="landing">
      <section className="l-hero">
        <div className="l-hero-text">
          <span className="l-kicker">Für Vereine · Unternehmen · Handwerk</span>
          <h1>Teamwear & Firmenbekleidung mit Ihrem Logo</h1>
          <p>Markentextilien schon ab 1 Stück – bedruckt oder bestickt, aus einer Hand. In Ihrem persönlichen Shop mit eigenen Konditionen und Ihrer Kollektion.</p>
          <div className="l-cta">
            <a href="#preis" className="btn l-btn">Preis anfragen</a>
            <Link href="/druck-stick" className="btn alt l-btn2">Druck & Stick erklärt</Link>
          </div>
          <ul className="l-checks">
            <li>Angebot innerhalb von 24 Stunden</li>
            <li>Ab 1 Stück, Mengenrabatt ab 10</li>
            <li>Logo-Vorschau direkt am Artikel</li>
          </ul>
        </div>
        {hero.length > 0 ? <HeroProducts items={hero} /> : <div />}
      </section>

      <div className="l-loginbar box">
        <div><strong>Schon Kunde?</strong><span className="muted"> Mit Ihrem Zugangscode direkt in Ihren Shop.</span></div>
        <AccessForm next="/" />
      </div>

      <section className="l-feats">
        {[
          ['Ab 1 Stück', 'Einzelteile, Nachbestellungen oder ganze Teams – ohne Mindestmenge, mit Staffelpreisen ab 10 Stück.'],
          ['Druck & Stick', 'Siebdruck, Transfer, Digitaldruck oder edler Stick – wir beraten, welches Verfahren zu Ihrem Logo passt.'],
          ['Ihr eigener Shop', 'Persönliche Konditionen, Ihre Kollektion, Ihr Logo hinterlegt. Mitglieder bestellen aus einer geteilten Auswahl.'],
          ['Angebot in 24 h', 'Anfrage abschicken, Angebot als PDF erhalten und mit einem Klick annehmen – fertig.'],
        ].map(([t, x]) => <div key={t} className="l-feat box"><h3>{t}</h3><p>{x}</p></div>)}
      </section>

      <section id="ablauf" className="l-section">
        <h2>So funktioniert’s</h2>
        <ol className="l-steps">
          <li><b>Artikel wählen</b><span>Farben und Größen in einer Übersicht eintragen – auch für das ganze Team auf einmal.</span></li>
          <li><b>Logo hochladen</b><span>Position und Verfahren wählen, Vorschau direkt am Artikel ansehen.</span></li>
          <li><b>Angebot annehmen</b><span>Sie erhalten Ihr Angebot als PDF und nehmen es online mit einem Klick an.</span></li>
          <li><b>Freigabe & Lieferung</b><span>Nach Ihrer Druckfreigabe produzieren wir – Lieferung meist in 7–14 Werktagen.</span></li>
        </ol>
      </section>

      {tiles.length > 0 && (
        <section className="l-section">
          <h2>Sortiment</h2>
          <CategoryTiles tiles={tiles} link={!previewMode()} />
          <p className="muted" style={{ marginTop: 14 }}>Marken u. a.: {BRANDS.join(' · ')}</p>
        </section>
      )}

      <section className="l-section">
        <h2>Für wen wir arbeiten</h2>
        <div className="zg-grid">{ZIELGRUPPEN.map((z) => <Link key={z.slug} href={`/fuer/${z.slug}`} className="box zg"><b>{z.nav}</b><span>{z.teaser}</span><em>Mehr erfahren →</em></Link>)}</div>
      </section>

      {!previewMode() && showcase.length > 0 && (
        <section className="l-section">
          <h2>Beliebte Artikel</h2>
          <div className="grid">{showcase.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          <p className="muted" style={{ marginTop: 10 }}>Preise und Bestellung nach Anmeldung mit Ihrem Zugangscode.</p>
        </section>
      )}

      {refs.length > 0 && (
        <section className="l-section" id="referenzen">
          <h2>Referenzen</h2>
          <div className="l-refs">
            {refs.map((r) => (
              <figure key={r.id} className="box l-ref">
                {r.imageId && <img src={`/api/bild/${r.imageId}`} alt={r.title} loading="lazy" />}
                <figcaption>{r.tag && <span className="l-tag">{r.tag}</span>}<b>{r.title}</b>{r.text && <span>{r.text}</span>}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <ReviewStrip reviews={latestReviews(6)} overall={overall()} />

      <NewsletterBox tiers={discountTiers()} />

      <section id="preis" className="l-section">
        <QuoteForm categories={cats.map((c) => c.name)} aside={<>
          <h2>Unverbindlich Preis anfragen</h2>
          <p>Sie haben noch keinen Zugangscode? Kein Problem: Beschreiben Sie kurz Ihr Vorhaben und schicken Sie Ihr Logo gleich mit. Sie erhalten innerhalb von 24 Stunden ein Angebot.</p>
          <ul><li>Kein Zugangscode nötig</li><li>Logo gleich mitschicken</li><li>Auf Wunsch vorab ein Muster</li><li>Unverbindlich und kostenlos</li></ul>
          <p className="muted" style={{ marginTop: 16 }}>Lieber sprechen? <a className="alink" href="tel:+491732648097">0173 2648097</a></p>
        </>} />
      </section>

      <section id="anfragen" className="l-section">
        <RequestForm aside={<>
          <h2>Zugang anfragen</h2>
          <p>Unser Shop ist exklusiv für Vereine, Unternehmen und Partner. Schreiben Sie uns kurz, wer Sie sind – Sie erhalten Ihren persönlichen Zugangscode innerhalb von 24 Stunden.</p>
          <p className="muted">Lieber direkt sprechen? <a className="alink" href="tel:+491732648097">0173 2648097</a> · <a className="alink" href="mailto:info@euro-trade.com">info@euro-trade.com</a></p>
        </>} />
      </section>
    </div>
  );
}
