export const metadata = { title: 'Impressum', description: 'Impressum von euro-trade.com – Sebastian Hosbach, Seehan 28, 44263 Dortmund. Kontakt: info@euro-trade.com, Telefon 0173 2648097.', alternates: { canonical: '/impressum' } };

export default function Page() {
  return (
    <div className="box" style={{ maxWidth: 760 }}>
      <h1>Impressum</h1>

      <h2 style={{ marginTop: 8 }}>Angaben gemäß § 5 DDG</h2>
      <p>
        Sebastian Hosbach<br />
        Seehan 28<br />
        44263 Dortmund<br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        Telefon: <a href="tel:+491732648097">0173 2648097</a><br />
        E-Mail: <a href="mailto:info@euro-trade.com">info@euro-trade.com</a>
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>Sebastian Hosbach, Anschrift wie oben</p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Haftung für Inhalte und Links</h2>
      <p>
        Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit
        und Aktualität der Inhalte, insbesondere der Produktdaten und Preise, können wir jedoch keine Gewähr
        übernehmen. Für Inhalte externer Links sind ausschließlich deren Betreiber verantwortlich.
      </p>
    </div>
  );
}
