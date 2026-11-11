import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Datenschutz', description: 'Datenschutzerklärung von euro-trade.com: welche Daten wir bei Anfragen, Newsletter, Bewertungen und Uploads verarbeiten und welche Rechte Sie haben.', robots: { index: false, follow: true } };

const S = ({ t, children }: { t: string; children: React.ReactNode }) => (<section><h2>{t}</h2>{children}</section>);

export default function Datenschutz() {
  return (
    <div className="box legal" style={{ maxWidth: 860 }}>
      <h1>Datenschutzerklärung</h1>
      <p className="muted">Stand: November 2026</p>

      <S t="1. Verantwortlicher">
        <p>Sebastian Hosbach · Euro-Trade<br />Seehan 28, 44263 Dortmund<br />Telefon: 0173 2648097 · E-Mail: <a href="mailto:info@euro-trade.com">info@euro-trade.com</a></p>
        <p>Ein Datenschutzbeauftragter ist nicht bestellt, da die gesetzlichen Voraussetzungen hierfür nicht vorliegen.</p>
      </S>

      <S t="2. Überblick">
        <p>Wir verarbeiten personenbezogene Daten nur, soweit dies für den Betrieb dieser Website, die Bearbeitung Ihrer Anfragen und die Abwicklung von Aufträgen erforderlich ist. Wir setzen <strong>keine Analyse- oder Tracking-Dienste, keine Werbe-Cookies und keine Social-Media-Plugins</strong> ein.</p>
      </S>

      <S t="3. Hosting und Server-Logfiles">
        <p>Die Website wird auf einem Server der IONOS SE, Elgendorfer Str. 57, 56410 Montabaur, in einem Rechenzentrum in Deutschland betrieben. Beim Aufruf werden technisch notwendige Daten verarbeitet (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browser-Typ, Referrer). Dies dient der Auslieferung der Website und ihrer Sicherheit, etwa der Abwehr von Angriffen.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren, stabilen Betrieb). Mit IONOS besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Zugriffe werden nicht dauerhaft protokolliert. Technische Fehlermeldungen landen in einem größenbegrenzten Protokollspeicher und werden automatisch überschrieben. Zum Schutz vor Missbrauch werden IP-Adressen bei Formularen kurzzeitig im Arbeitsspeicher gehalten (höchstens 1 Stunde).</p>
      </S>

      <S t="4. Produktbilder von L-SHOP-TEAM">
        <p>Produktbilder und Größentabellen werden direkt von den Servern unseres Lieferanten L-SHOP-TEAM GmbH, Otto-Hahn-Straße 27, 59423 Unna, geladen. Dabei wird Ihre IP-Adresse technisch bedingt an L-SHOP-TEAM übermittelt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer aktuellen und vollständigen Produktdarstellung).</p>
      </S>

      <S t="5. Cookies und lokaler Speicher">
        <p>Wir verwenden ausschließlich technisch notwendige Cookies:</p>
        <ul>
          <li><strong>et_access</strong> – speichert, dass Sie sich mit Ihrem Zugangscode angemeldet haben (Laufzeit 180 Tage).</li>
          <li><strong>et_admin</strong> – nur für die Shop-Verwaltung (Laufzeit 30 Tage).</li>
        </ul>
        <p>Zusätzlich werden Warenkorb, Merkliste, zuletzt angesehene Artikel, Ihre zuletzt verwendeten Formulardaten und die Nummern Ihrer Anfragen <strong>nur lokal in Ihrem Browser</strong> (Local Storage) gespeichert. Diese Daten werden nicht an uns übertragen, bis Sie eine Anfrage absenden. Sie können sie jederzeit über die Browser-Einstellungen löschen.</p>
        <p>Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG, da die Speicherung für den von Ihnen gewünschten Dienst unbedingt erforderlich ist, sowie Art. 6 Abs. 1 lit. b und f DSGVO.</p>
      </S>

      <S t="6. Zugangsanfrage">
        <p>Wenn Sie über die Startseite einen Zugang anfragen, verarbeiten wir Name, Verein/Firma, E-Mail-Adresse, Telefonnummer (freiwillig), die Art Ihrer Organisation und Ihre Nachricht, um Ihnen einen Zugangscode zu erteilen und mit Ihnen Kontakt aufzunehmen.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen auf Ihre Anfrage). Nicht zustande gekommene Anfragen löschen wir spätestens nach 12 Monaten.</p>
      </S>

      <S t="7. Anfragen, Angebote und Aufträge">
        <p>Für Angebotsanfragen über den Warenkorb verarbeiten wir Ihre Kontaktdaten (Name, Firma, E-Mail, Telefon, Ort), den Wunschliefertermin, Ihre Nachricht, die gewählten Artikel und, falls angegeben, Ihre Veredelungswünsche einschließlich Texten und hochgeladener Logo-Dateien. Wir nutzen diese Daten, um Ihnen ein Angebot zu erstellen, es per E-Mail zuzusenden und den Auftrag abzuwickeln. Das Angebot können Sie über einen persönlichen Link einsehen und annehmen. Bei der Annahme speichern wir Ihren Namen, Ihre Anmerkung und den Zeitpunkt.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Für die Herstellung und Lieferung geben wir die erforderlichen Daten an unseren Lieferanten L-SHOP-TEAM GmbH sowie gegebenenfalls an Veredelungsbetriebe und Versanddienstleister weiter.</p>
        <p>Angebots- und Auftragsdaten speichern wir für die Dauer der Geschäftsbeziehung und darüber hinaus, soweit gesetzliche Aufbewahrungspflichten bestehen (§ 147 AO, § 257 HGB: bis zu 10 Jahre). Nicht angenommene Anfragen und hochgeladene Logos löschen wir spätestens nach 24 Monaten, sofern Sie keine längere Speicherung wünschen, etwa für Nachbestellungen.</p>
      </S>

      <section id="newsletter"><h2>7a. Newsletter und Willkommensrabatt</h2>
        <p>Wenn Sie sich für unseren Newsletter anmelden, verarbeiten wir Ihre E-Mail-Adresse und, falls angegeben, die Art Ihrer Organisation, um Ihnen Angebote, Neuheiten und Ihren persönlichen Willkommensrabatt zu senden. Wir nutzen das Double-Opt-in-Verfahren: Erst nach Klick auf den Bestätigungslink in unserer E-Mail sind Sie angemeldet. Wir speichern Zeitpunkt der Anmeldung und Bestätigung als Nachweis.</p>
        <p>Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können sie jederzeit über den Abmeldelink in jeder E-Mail oder per Nachricht an uns widerrufen. Nach der Abmeldung löschen wir Ihre Adresse, soweit wir sie nicht zum Nachweis einer früheren Einwilligung kurzfristig aufbewahren müssen (Art. 6 Abs. 1 lit. f DSGVO). Unbestätigte Anmeldungen löschen wir nach 30 Tagen.</p>
      </section>

      <section id="newsletter"><h2>7a. Newsletter und Willkommensrabatt</h2>
        <p>Wenn Sie sich für unseren Newsletter anmelden, verarbeiten wir Ihre E-Mail-Adresse und, falls angegeben, die Art Ihrer Organisation, um Ihnen Angebote, Neuheiten und Ihren persönlichen Willkommensrabatt zu senden. Wir nutzen das Double-Opt-in-Verfahren: Erst nach Klick auf den Bestätigungslink in unserer E-Mail sind Sie angemeldet. Wir speichern Zeitpunkt der Anmeldung und Bestätigung als Nachweis.</p>
        <p>Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können sie jederzeit über den Abmeldelink in jeder E-Mail oder per Nachricht an uns widerrufen. Nach der Abmeldung löschen wir Ihre Adresse, soweit wir sie nicht zum Nachweis einer früheren Einwilligung kurzfristig aufbewahren müssen (Art. 6 Abs. 1 lit. f DSGVO). Unbestätigte Anmeldungen löschen wir nach 30 Tagen.</p>
      </section>

      <S t="7b. Bewertungen">
        <p>Nach Abschluss eines Auftrags laden wir Sie per E-Mail ein, Ihre Bestellung zu bewerten (Art. 6 Abs. 1 lit. f DSGVO, berechtigtes Interesse an Kundenfeedback; Sie können dem jederzeit widersprechen). Wenn Sie eine Bewertung abgeben, veröffentlichen wir Sternebewertung, Überschrift, Text, den von Ihnen gewählten Anzeigenamen, optional Ihre Firma bzw. Ihren Verein sowie Monat und Jahr. Ihre E-Mail-Adresse wird nicht veröffentlicht. Rechtsgrundlage für die Veröffentlichung ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit per E-Mail widerrufen können. Die Bewertung wird dann gelöscht.</p>
      </S>

      <S t="8. E-Mail-Versand">
        <p>Bestätigungen, Angebote und Auftragsbestätigungen versenden wir über den E-Mail-Dienst der IONOS SE (Auftragsverarbeitung nach Art. 28 DSGVO). Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung Ihres Anliegens (Art. 6 Abs. 1 lit. b bzw. f DSGVO).</p>
      </S>

      <S t="9. WhatsApp und Telefon">
        <p>Über den Kontakt-Button können Sie uns per WhatsApp, Telefon oder E-Mail erreichen. Erst wenn Sie „WhatsApp“ anklicken, werden Sie zu WhatsApp weitergeleitet. Anbieter ist die WhatsApp Ireland Ltd., 4 Grand Canal Square, Dublin 2, Irland. Dabei können Daten auch in die USA übermittelt werden; WhatsApp bzw. Meta ist nach dem EU-US Data Privacy Framework zertifiziert. Für die Datenverarbeitung durch WhatsApp gilt deren Datenschutzerklärung. Die Nutzung ist freiwillig, Sie können uns jederzeit auch per Telefon oder E-Mail erreichen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO (Ihre Entscheidung, diesen Kanal zu nutzen) bzw. lit. b DSGVO.</p>
      </S>

      <S t="10. Ihre Rechte">
        <p>Sie haben jederzeit das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO). Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Eine formlose E-Mail an <a href="mailto:info@euro-trade.com">info@euro-trade.com</a> genügt.</p>
        <p>Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, zum Beispiel bei der für uns zuständigen Landesbeauftragten für Datenschutz und Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf.</p>
      </S>

      <S t="11. Sicherheit">
        <p>Die Übertragung erfolgt verschlüsselt per HTTPS. Zugangs- und Verwaltungsbereiche sind passwort- bzw. codegeschützt, Angebotslinks enthalten zufällige, nicht erratbare Schlüssel.</p>
      </S>
    </div>
  );
}
