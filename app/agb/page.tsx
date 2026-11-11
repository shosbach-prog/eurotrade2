import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AGB',
  description: 'Allgemeine Geschäftsbedingungen von euro-trade.com – Textilien und Werbemittel mit Druck und Stick für Unternehmen, Vereine und Privatkunden.',
  alternates: { canonical: '/agb' },
};

const S = ({ n, t, children }: { n: number; t: string; children: React.ReactNode }) => <section id={`p${n}`}><h2>§ {n} {t}</h2>{children}</section>;

export default function AGB() {
  return (
    <div className="info legal-page legal">
      <div className="crumbs"><Link href="/">Start</Link> › AGB</div>
      <h1>Allgemeine Geschäftsbedingungen</h1>
      <p className="lead">Stand: November 2026</p>

      <S n={1} t="Geltungsbereich, Anbieter">
        <p>(1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die Lieferung von Textilien, Werbemitteln und deren Veredelung (Druck, Stick, Transfer), die über die Website euro-trade.com, per E-Mail oder telefonisch geschlossen werden zwischen</p>
        <p>Euro-Trade, Inhaber Sebastian Hosbach, Seehang 28, 44263 Dortmund, Telefon 0173 2648097, E-Mail info@euro-trade.com (nachfolgend „Euro-Trade“ oder „wir“)</p>
        <p>und dem Kunden. Kunden sind Verbraucher (§ 13 BGB) und Unternehmer (§ 14 BGB) einschließlich Vereinen, juristischen Personen und öffentlichen Einrichtungen.</p>
        <p>(2) Abweichende Bedingungen des Kunden gelten nicht, es sei denn, wir stimmen ihnen ausdrücklich schriftlich zu.</p>
      </S>

      <S n={2} t="Kundenkonto und Zugang">
        <p>(1) Preise und Bestellfunktionen sind nach Anmeldung mit Zugangscode oder E-Mail-Adresse und Passwort sichtbar. Ein Anspruch auf Freischaltung eines Kundenkontos besteht nicht.</p>
        <p>(2) Der Kunde hält seine Zugangsdaten geheim und informiert uns unverzüglich, wenn ein Missbrauch zu befürchten ist.</p>
      </S>

      <S n={3} t="Vertragsschluss">
        <p>(1) Die Darstellung der Artikel auf der Website ist kein bindendes Angebot, sondern eine Aufforderung zur Abgabe einer Anfrage.</p>
        <p>(2) Mit dem Absenden einer Anfrage (Warenkorb, Preisanfrage oder Kontaktformular) bittet der Kunde um ein Angebot. Die automatische Eingangsbestätigung ist noch keine Annahme.</p>
        <p>(3) Wir erstellen ein schriftliches Angebot (per E-Mail bzw. als PDF) mit Artikeln, Mengen, Veredelung, Preisen, Versandkosten und Lieferzeit. Das Angebot ist für die darin genannte Frist gültig.</p>
        <p>(4) Der Vertrag kommt zustande, wenn der Kunde das Angebot innerhalb der Gültigkeitsfrist annimmt – durch Klick auf „Angebot annehmen“, per E-Mail oder schriftlich. Wir bestätigen die Annahme per E-Mail.</p>
        <p>(5) Die Vertragssprache ist Deutsch. Den Vertragstext (Angebot und Bestätigung) speichern wir; der Kunde erhält ihn per E-Mail.</p>
      </S>

      <S n={4} t="Preise und Versandkosten">
        <p>(1) Auf der Website angezeigte Preise sind Nettopreise zuzüglich der gesetzlichen Umsatzsteuer, sofern nicht anders gekennzeichnet. Im Angebot werden Netto- und Bruttobetrag ausgewiesen. Für Verbraucher ist der Bruttopreis maßgeblich.</p>
        <p>(2) Mengenrabatte (Staffelpreise) beziehen sich auf die Gesamtmenge eines Artikels in einer Bestellung, über alle Farben und Größen.</p>
        <p>(3) Kosten für Veredelung (z. B. Druck, Stick, Einrichtung, Stickprogramm) und Versand werden im Angebot gesondert ausgewiesen.</p>
      </S>

      <S n={5} t="Zahlung">
        <p>(1) Die Zahlung erfolgt per Vorkasse (Überweisung), sofern im Angebot keine andere Zahlungsart vereinbart ist. Für Unternehmer, Vereine und öffentliche Einrichtungen kann nach Vereinbarung Zahlung auf Rechnung erfolgen.</p>
        <p>(2) Rechnungen sind innerhalb von 14 Tagen nach Rechnungsdatum ohne Abzug fällig, soweit nichts anderes vereinbart ist.</p>
        <p>(3) Rabattcodes sind nicht mit anderen Aktionen kombinierbar, nicht auszahlbar und nur innerhalb ihrer Gültigkeit einlösbar.</p>
      </S>

      <S n={6} t="Lieferung">
        <p>(1) Wir liefern an die vom Kunden angegebene Adresse innerhalb Deutschlands; Lieferungen ins Ausland nach Vereinbarung.</p>
        <p>(2) Die Lieferzeit ergibt sich aus dem Angebot. Bei veredelter Ware beginnt sie mit der Freigabe der Vorschau (§ 7) und – bei Vorkasse – mit Zahlungseingang.</p>
        <p>(3) Ist ein Artikel beim Lieferanten nicht verfügbar, informieren wir den Kunden unverzüglich und bieten eine gleichwertige Alternative an. Bereits geleistete Zahlungen für nicht lieferbare Ware erstatten wir unverzüglich.</p>
        <p>(4) Teillieferungen sind zulässig, soweit sie dem Kunden zumutbar sind.</p>
      </S>

      <S n={7} t="Veredelung, Druckdaten und Freigabe">
        <p>(1) Der Kunde stellt seine Motive (Logo, Text, Grafik) in geeigneter Qualität zur Verfügung, möglichst als Vektordatei (AI, EPS, PDF, SVG) oder als hoch aufgelöste Bilddatei.</p>
        <p>(2) Der Kunde versichert, dass er die Rechte an den übermittelten Motiven besitzt (Marken-, Urheber-, Namens- und Persönlichkeitsrechte) und deren Verwendung keine Rechte Dritter verletzt. Er stellt uns von Ansprüchen Dritter frei, die aus einer solchen Verletzung entstehen. Motive mit rechtswidrigen, diskriminierenden oder verfassungsfeindlichen Inhalten lehnen wir ab.</p>
        <p>(3) Vor der Produktion erhält der Kunde eine Vorschau (Position, Größe, Farben). Die Produktion beginnt erst nach seiner Freigabe. Für Fehler, die in der freigegebenen Vorschau erkennbar waren, haften wir nicht.</p>
        <p>(4) Die Logo-Vorschau im Shop ist unverbindlich. Verfahrensbedingte Abweichungen sind möglich und kein Mangel, insbesondere geringe Farbabweichungen zwischen Bildschirm, Textil und Veredelung, Positionsabweichungen von bis zu ± 1 cm sowie Detailvereinfachungen bei feinen Linien und kleinen Schriften im Stick.</p>
        <p>(5) Bei Mengen ab 50 Stück kann die gelieferte Menge um bis zu 3 % abweichen (produktionsbedingte Fehldrucke); berechnet wird die tatsächlich gelieferte Menge.</p>
      </S>

      <S n={8} t="Widerrufsrecht">
        <p>(1) Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Einzelheiten regelt die <Link href="/widerruf" className="alink">Widerrufsbelehrung</Link>.</p>
        <p>(2) Das Widerrufsrecht besteht nicht bei Waren, die nach Kundenspezifikation angefertigt werden oder eindeutig auf die persönlichen Bedürfnisse zugeschnitten sind (§ 312g Abs. 2 Nr. 1 BGB). Das betrifft insbesondere bedruckte, bestickte oder anderweitig individuell veredelte Textilien.</p>
        <p>(3) Unternehmern steht kein gesetzliches Widerrufsrecht zu. Ein Umtausch unveredelter Ware ist nach vorheriger Absprache möglich.</p>
      </S>

      <S n={9} t="Eigentumsvorbehalt">
        <p>Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum. Gegenüber Unternehmern behalten wir uns das Eigentum bis zur Begleichung aller Forderungen aus der laufenden Geschäftsbeziehung vor.</p>
      </S>

      <S n={10} t="Mängel und Gewährleistung">
        <p>(1) Es gelten die gesetzlichen Mängelrechte.</p>
        <p>(2) Offensichtliche Mängel, Falsch- und Fehllieferungen bitten wir innerhalb von 7 Tagen nach Erhalt mit Fotos an info@euro-trade.com zu melden. Für Verbraucher hat das keine Auswirkung auf ihre gesetzlichen Ansprüche.</p>
        <p>(3) Unternehmer müssen die Ware unverzüglich untersuchen und Mängel unverzüglich rügen (§ 377 HGB). Gegenüber Unternehmern beträgt die Verjährungsfrist für Mängelansprüche ein Jahr ab Ablieferung; dies gilt nicht für Schadensersatzansprüche nach § 11 und bei Arglist.</p>
        <p>(4) Bei berechtigten Mängeln liefern wir nach unserer Wahl Ersatz oder bessern nach. Schlägt die Nacherfüllung fehl, kann der Kunde mindern oder vom Vertrag zurücktreten.</p>
      </S>

      <S n={11} t="Haftung">
        <p>(1) Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz.</p>
        <p>(2) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten (Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig vertrauen darf) ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.</p>
      </S>

      <S n={12} t="Streitbeilegung">
        <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </S>

      <S n={13} t="Schlussbestimmungen">
        <p>(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Gegenüber Verbrauchern gilt diese Rechtswahl nur, soweit dadurch nicht zwingende Verbraucherschutzvorschriften des Staates entzogen werden, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat.</p>
        <p>(2) Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand Dortmund.</p>
        <p>(3) Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>
      </S>
    </div>
  );
}
