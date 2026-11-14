import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rückgabe & Widerruf',
  description: 'Rückgabe, Umtausch und Widerrufsrecht bei euro-trade.com – einfach erklärt, inklusive Widerrufsbelehrung und Muster-Formular.',
  alternates: { canonical: '/widerruf' },
};

export default function Widerruf() {
  return (
    <div className="info legal-page">
      <div className="crumbs"><Link href="/">Startseite</Link> › Rückgabe & Widerruf</div>
      <h1>Rückgabe & Widerruf</h1>
      <p className="lead">Wir möchten, dass Sie mit Ihrer Bestellung rundum zufrieden sind. Hier finden Sie alles zu Rückgabe, Umtausch und Reklamation, kurz erklärt und darunter in der gesetzlich vorgeschriebenen Form.</p>

      <div className="ret-grid">
        <div className="box ret"><div className="ret-ico">14</div><h3>14 Tage Widerrufsrecht</h3><p>Unveredelte Ware können Verbraucher innerhalb von 14 Tagen nach Erhalt ohne Angabe von Gründen zurückgeben.</p></div>
        <div className="box ret"><div className="ret-ico">✦</div><h3>Veredelte Ware</h3><p>Bedruckte oder bestickte Artikel werden nur für Sie gefertigt und sind daher vom Umtausch und Widerruf ausgeschlossen, außer bei Mängeln.</p></div>
        <div className="box ret"><div className="ret-ico">✓</div><h3>Freigabe vor Produktion</h3><p>Vor jeder Veredelung erhalten Sie eine Vorschau. Erst nach Ihrer Freigabe produzieren wir. So vermeiden wir Fehler von Anfang an.</p></div>
        <div className="box ret"><div className="ret-ico">!</div><h3>Reklamation</h3><p>Etwas stimmt nicht? Melden Sie sich innerhalb von 7 Tagen mit Fotos. Bei Mängeln oder Fehlern unsererseits ersetzen wir kostenlos.</p></div>
      </div>

      <h2>So funktioniert die Rückgabe</h2>
      <ol className="l-steps">
        <li><b>Kurz melden</b><span>Schreiben Sie an <a href="mailto:info@euro-trade.com" className="alink">info@euro-trade.com</a> mit Ihrer Auftragsnummer und den Artikeln, die Sie zurückgeben möchten.</span></li>
        <li><b>Rücksendeinfos erhalten</b><span>Sie bekommen von uns die Rücksendeadresse und alle Hinweise.</span></li>
        <li><b>Ware zurückschicken</b><span>Ungetragen, ungewaschen, ohne Gebrauchsspuren und möglichst in der Originalverpackung.</span></li>
        <li><b>Erstattung</b><span>Nach Eingang und Prüfung erstatten wir den Betrag innerhalb von 14 Tagen auf dem ursprünglichen Zahlungsweg.</span></li>
      </ol>

      <h2>Gut zu wissen</h2>
      <div className="faq">
        <details className="box" open><summary>Gilt das Widerrufsrecht auch für Firmen und Vereine?</summary><p>Das gesetzliche Widerrufsrecht gilt nur für Verbraucher, also Privatpersonen. Bei Bestellungen von Unternehmen, Vereinen oder Behörden besteht kein gesetzliches Widerrufsrecht. Sprechen Sie uns trotzdem an, bei unveredelter Ware finden wir in der Regel eine Lösung.</p></details>
        <details className="box"><summary>Kann ich Größen umtauschen?</summary><p>Unveredelte Artikel tauschen wir gern innerhalb von 14 Tagen in eine andere Größe oder Farbe um, solange verfügbar. Bei veredelten Artikeln ist ein Umtausch nicht möglich. Nutzen Sie deshalb vor der Bestellung die Größentabelle am Artikel. Gern schicken wir Ihnen auch vorab unveredelte Musterteile zur Anprobe.</p></details>
        <details className="box"><summary>Was ist, wenn der Druck oder Stick fehlerhaft ist?</summary><p>Weicht die Veredelung von der freigegebenen Vorschau ab oder ist die Ware mangelhaft, fertigen wir kostenlos neu oder erstatten den Betrag. Ihre gesetzlichen Gewährleistungsrechte bleiben unberührt.</p></details>
        <details className="box"><summary>Wer trägt die Kosten der Rücksendung?</summary><p>Bei einem Widerruf tragen Sie die unmittelbaren Kosten der Rücksendung. Bei Mängeln oder falsch gelieferter Ware übernehmen wir die Kosten vollständig.</p></details>
      </div>

      <h2 id="widerrufsbelehrung">Widerrufsbelehrung</h2>
      <div className="box legal">
        <p><em>Die folgende Belehrung gilt für Verbraucher im Sinne von § 13 BGB.</em></p>
        <h3>Widerrufsrecht</h3>
        <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat. Bei mehreren Waren, die getrennt geliefert werden, beginnt die Frist mit dem Tag, an dem Sie oder ein von Ihnen benannter Dritter die letzte Ware in Besitz genommen haben bzw. hat.</p>
        <p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Sebastian Hosbach, Euro-Trade, Seehang 28, 44263 Dortmund, Telefon: 030 40719258, E-Mail: info@euro-trade.com) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.</p>
        <p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>
        <h3>Folgen des Widerrufs</h3>
        <p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.</p>
        <p>Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.</p>
        <p>Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.</p>
        <p>Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.</p>
        <p>Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.</p>
        <h3>Ausschluss des Widerrufsrechts</h3>
        <p>Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren, die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder Bestimmung durch den Verbraucher maßgeblich ist oder die eindeutig auf die persönlichen Bedürfnisse des Verbrauchers zugeschnitten sind (§ 312g Abs. 2 Nr. 1 BGB). Dies betrifft insbesondere <strong>Textilien, die nach Ihren Vorgaben bedruckt, bestickt oder anderweitig veredelt werden</strong> (z. B. mit Logo, Text, Namen oder Nummern).</p>
      </div>

      <h2 id="formular">Muster-Widerrufsformular</h2>
      <div className="box legal">
        <p><em>Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.</em></p>
        <p>An: Sebastian Hosbach, Euro-Trade, Seehang 28, 44263 Dortmund, E-Mail: info@euro-trade.com</p>
        <p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)</p>
        <p className="form-line">_____________________________________________</p>
        <p>Bestellt am (*)/erhalten am (*): ______________________</p>
        <p>Name des/der Verbraucher(s): ______________________</p>
        <p>Anschrift des/der Verbraucher(s): ______________________</p>
        <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): ______________________</p>
        <p>Datum: ______________________</p>
        <p className="muted">(*) Unzutreffendes streichen.</p>
      </div>

      <div className="box l-cta-box">
        <div><h2 style={{ margin: 0 }}>Fragen zu Ihrer Bestellung?</h2><p className="muted" style={{ margin: '4px 0 0' }}>Wir helfen schnell und unkompliziert.</p></div>
        <a href="mailto:info@euro-trade.com" className="btn" style={{ display: 'inline-grid', placeItems: 'center' }}>info@euro-trade.com</a>
      </div>
    </div>
  );
}
