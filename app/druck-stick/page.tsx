import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd, { crumbSchema, faqSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Druck oder Stick? Verfahren im Vergleich',
  description: 'Siebdruck, Transferdruck, Digitaldruck (DTF) und Stick im Vergleich: Mindestmengen, Vorteile, Grenzen, Logo-Anforderungen und typische Größen für Teamwear und Firmenbekleidung.',
  alternates: { canonical: '/druck-stick' },
};

const METHODS = [
  {
    name: 'Stick', tag: 'edel & langlebig', min: 'ab ca. 10 Stück sinnvoll',
    good: ['Hochwertige Optik, sehr langlebig', 'Ideal für Polos, Hemden, Jacken, Caps', 'Übersteht Industriewäsche'],
    limits: ['Sehr feine Details und Schrift unter ca. 4 mm schwierig', 'Einmalige Kosten für das Stickprogramm', 'Keine Farbverläufe'],
    for: 'Firmenbekleidung, Vereinslogo auf der Brust, Caps',
  },
  {
    name: 'Siebdruck', tag: 'günstig bei Menge', min: 'ab ca. 25–50 Stück wirtschaftlich',
    good: ['Sehr günstiger Stückpreis bei großen Mengen', 'Kräftige, deckende Farben', 'Sehr waschbeständig'],
    limits: ['Einrichtungskosten je Farbe', 'Wenige Farben pro Motiv', 'Nicht für Einzelstücke'],
    for: 'Event-Shirts, Promotion, große Teamauflagen',
  },
  {
    name: 'Digitaltransfer (DTF)', tag: 'vollfarbig ab 1 Stück', min: 'ab 1 Stück',
    good: ['Beliebig viele Farben, Verläufe und Fotos', 'Auf Baumwolle, Polyester und Mischgewebe', 'Keine Einrichtungskosten'],
    limits: ['Leicht spürbare Oberfläche', 'Bei sehr großen Flächen weniger atmungsaktiv'],
    for: 'Bunte Logos, Kleinserien, Nachbestellungen',
  },
  {
    name: 'Flex- / Flocktransfer', tag: 'Namen & Nummern', min: 'ab 1 Stück',
    good: ['Perfekt für Namen und Rückennummern', 'Leuchtende Effekte (Neon, Reflex, Metallic)', 'Sehr robust'],
    limits: ['Nur einfarbige Flächen je Folie', 'Keine feinen Details'],
    for: 'Trikots, Personalisierung, Warnwesten-Schriftzüge',
  },
];

const FAQ: [string, string][] = [["Kann ich auch nur ein einzelnes Teil veredeln lassen?", "Ja. Mit Digitaltransfer oder Flex ist das ab 1 Stück möglich. Für Stick fallen einmalige Kosten für das Stickprogramm an, deshalb lohnt er sich meist ab etwa 10 Teilen. Bei Nachbestellungen nutzen wir dasselbe Programm erneut."], ["Was kostet die Veredelung?", "Das hängt von Verfahren, Größe, Farbanzahl und Menge ab. Sie erhalten die Kosten transparent als eigene Position im Angebot."], ["Können Namen und Nummern individuell sein?", "Ja. Tragen Sie die Namen und Nummern einfach im Hinweisfeld der Veredelung ein oder schicken Sie uns eine Liste. Das ist ideal für Trikots und Teamwear."], ["Wie wasche ich veredelte Textilien?", "Auf links gedreht bei der angegebenen Temperatur waschen und nicht direkt auf dem Motiv bügeln. So bleiben Druck und Stick lange schön."]];

const SIZES = [
  ['Brust links / rechts', 'ca. 8–10 cm breit', 'Klassisch für Logos auf Polos, Hemden, Jacken'],
  ['Brust mittig', 'bis ca. 25 cm breit', 'Großes Front-Motiv auf T-Shirts und Hoodies'],
  ['Rücken', 'bis ca. 30 × 40 cm', 'Großer Schriftzug, Namen und Nummern'],
  ['Nacken', 'ca. 6–8 cm breit', 'Dezentes Zweitlogo oder Webadresse'],
  ['Ärmel', 'ca. 6–8 cm breit', 'Sponsor, Flagge oder Zusatzlogo'],
  ['Cap / Mütze vorne', 'ca. 5–10 cm breit', 'Logo-Stick auf Front oder Umschlag'],
  ['Handtuch Bordüre / Ecke', 'ca. 8–20 cm breit', 'Name oder Logo als Stick auf Bordüre oder Ecke'],
  ['Tasche Vorderseite', 'bis ca. 25 × 30 cm', 'Großes Motiv auf Baumwolltaschen und Rucksäcken'],
];

export default function DruckStick() {
  return (
    <div className="info">
      <div className="crumbs"><Link href="/">Start</Link> › Druck & Stick</div>
      <h1>Druck & Stick: welches Verfahren passt zu Ihrem Logo?</h1>
      <p className="lead">Ob Vereinslogo auf der Brust, Namen auf dem Rücken oder ein buntes Motiv auf dem Event-Shirt: Für jedes Projekt gibt es das passende Verfahren. Hier finden Sie die wichtigsten Unterschiede auf einen Blick. Wenn Sie unsicher sind, wählen Sie bei Ihrer Anfrage einfach „Beratung gewünscht“.</p>

      <div className="m-grid">
        {METHODS.map((m) => (
          <div key={m.name} className="box m-card">
            <div className="m-head"><h2>{m.name}</h2><span className="l-tag">{m.tag}</span></div>
            <p className="m-min">{m.min}</p>
            <div className="m-cols">
              <div><b>Stärken</b><ul className="pro">{m.good.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><b>Grenzen</b><ul className="con">{m.limits.map((x) => <li key={x}>{x}</li>)}</ul></div>
            </div>
            <p className="m-for"><b>Ideal für:</b> {m.for}</p>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 13 }}>Mindestmengen sind Richtwerte. Den genauen Preis für Ihr Motiv erhalten Sie mit dem Angebot.</p>

      <h2>Positionen & typische Größen</h2>
      <div className="box" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="atable">
          <thead><tr><th>Position</th><th>Typische Größe</th><th>Verwendung</th></tr></thead>
          <tbody>{SIZES.map(([a, b, c]) => <tr key={a}><td><b>{a}</b></td><td>{b}</td><td>{c}</td></tr>)}</tbody>
        </table>
      </div>

      <h2>So liefern Sie Ihr Logo richtig an</h2>
      <div className="box">
        <ul className="feat" style={{ marginTop: 0 }}>
          <li><b>Am besten:</b> Vektordatei als AI, EPS, SVG oder PDF (mit Schriften in Pfade umgewandelt).</li>
          <li><b>Auch möglich:</b> PNG oder JPG in hoher Auflösung, mindestens 300 dpi in Druckgröße und möglichst mit transparentem Hintergrund.</li>
          <li><b>Farben:</b> Wenn vorhanden, nennen Sie uns die Pantone- oder HKS-Farben. Dann treffen wir Ihr Firmen- oder Vereinsdesign genau.</li>
          <li><b>Kein passendes Format?</b> Kein Problem, wir prüfen jede Datei und melden uns, falls etwas nachbearbeitet werden muss.</li>
        </ul>
      </div>

      <h2>Ablauf</h2>
      <ol className="l-steps">
        <li><b>Anfrage</b><span>Artikel, Mengen und Logo im Shop auswählen und Anfrage senden.</span></li>
        <li><b>Angebot</b><span>Sie erhalten innerhalb von 24 Stunden ein Angebot inklusive Veredelung als PDF.</span></li>
        <li><b>Freigabe</b><span>Nach Ihrer Annahme schicken wir Ihnen eine Druck- oder Stickvorschau zur Freigabe.</span></li>
        <li><b>Lieferung</b><span>Produktion und Versand meist in 7–14 Werktagen nach Freigabe.</span></li>
      </ol>

      <h2>Häufige Fragen</h2>
      <div className="faq">
        {FAQ.map(([q, a], k) => <details key={q} className="box" open={k === 0}><summary>{q}</summary><p>{a}</p></details>)}
      </div>
      <JsonLd data={faqSchema(FAQ)} />
      <JsonLd data={crumbSchema([['Start', '/'], ['Druck & Stick', '/druck-stick']])} />

      <div className="box l-cta-box">
        <div><h2 style={{ margin: 0 }}>Bereit für Ihr Projekt?</h2><p className="muted" style={{ margin: '4px 0 0' }}>Fragen Sie Ihren persönlichen Zugang an, oder melden Sie sich mit Ihrem Code an.</p></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/#anfragen" className="btn" style={{ display: 'inline-grid', placeItems: 'center' }}>Zugang anfragen</Link>
          <Link href="/zugang" className="btn alt" style={{ display: 'inline-grid', placeItems: 'center' }}>Anmelden</Link>
        </div>
      </div>
    </div>
  );
}
