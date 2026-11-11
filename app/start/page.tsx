import Link from 'next/link';
import type { Metadata } from 'next';
import AccessForm from '../zugang/AccessForm';
import RequestForm from './RequestForm';
import NewsletterBox from './NewsletterBox';
import { ReviewStrip } from '@/components/ProductReviews';
import { latestReviews, overall } from '@/lib/reviews';
import { discountTiers, listReferences } from '@/lib/store';
import { getCategories } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Teamwear & Firmenbekleidung mit Logo – ab 1 Stück',
  description: 'Markentextilien für Vereine, Unternehmen und Handwerk – bedruckt oder bestickt, schon ab 1 Stück. Persönlicher Shop mit Ihren Konditionen, Angebot in 24 Stunden.',
  alternates: { canonical: '/' },
};

const BRANDS = ['Asquith & Fox', 'B&C', 'Beechfield', 'Daiber', 'HRM', 'Mantis', 'Marvelis', 'Result', 'Tee Jays', 'TriDri®', 'Onna by Premier', 'ARTG'];

export default function Start() {
  const refs = listReferences();
  const cats = getCategories().slice(0, 8);
  return (
    <div className="landing">
      <section className="l-hero">
        <div className="l-hero-text">
          <span className="l-kicker">Für Vereine · Unternehmen · Handwerk</span>
          <h1>Teamwear & Firmenbekleidung mit Ihrem Logo</h1>
          <p>Markentextilien schon ab 1 Stück – bedruckt oder bestickt, aus einer Hand. In Ihrem persönlichen Shop mit eigenen Konditionen und Ihrer Kollektion.</p>
          <div className="l-cta">
            <a href="#anfragen" className="btn l-btn">Zugang anfragen</a>
            <Link href="/druck-stick" className="btn alt l-btn2">Druck & Stick erklärt</Link>
          </div>
          <ul className="l-checks">
            <li>Angebot innerhalb von 24 Stunden</li>
            <li>Ab 1 Stück, Mengenrabatt ab 10</li>
            <li>Logo-Vorschau direkt am Artikel</li>
          </ul>
        </div>
        <div className="l-login box">
          <strong>Schon Kunde?</strong>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>Mit Ihrem Zugangscode direkt in Ihren Shop.</p>
          <AccessForm next="/" />
        </div>
      </section>

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

      {cats.length > 0 && (
        <section className="l-section">
          <h2>Sortiment</h2>
          <div className="chips">{cats.map((c) => <span key={c.slug} className="chip">{c.name}</span>)}<span className="chip">und vieles mehr</span></div>
          <p className="muted" style={{ marginTop: 14 }}>Marken u. a.: {BRANDS.join(' · ')}</p>
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

      <section id="anfragen" className="l-section l-request">
        <div>
          <h2>Zugang anfragen</h2>
          <p>Unser Shop ist exklusiv für Vereine, Unternehmen und Partner. Schreiben Sie uns kurz, wer Sie sind – Sie erhalten Ihren persönlichen Zugangscode innerhalb von 24 Stunden.</p>
          <p className="muted">Lieber direkt sprechen? <a className="alink" href="tel:+491732648097">0173 2648097</a> · <a className="alink" href="mailto:info@euro-trade.com">info@euro-trade.com</a></p>
        </div>
        <RequestForm />
      </section>
    </div>
  );
}
