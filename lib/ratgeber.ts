// Ratgeber-Artikel (SEO) – sachlich, ohne Werbeversprechen; Links zeigen auf passende Shop-Bereiche
export type Guide = {
  slug: string; title: string; description: string; teaser: string; minutes: number; icon: string;
  sections: { h: string; p: string[]; list?: string[] }[];
  faq: [string, string][];
  links: [string, string][];
};

export const GUIDES: Guide[] = [
  {
    slug: 'druck-oder-stick', icon: '🧵', minutes: 4,
    title: 'Druck oder Stick? So finden Sie das richtige Verfahren',
    description: 'Siebdruck, Digitaltransfer, Flex oder Stick: Vor- und Nachteile, Kosten und Einsatzbereiche der Textilveredelung einfach erklärt.',
    teaser: 'Welches Verfahren passt zu Logo, Menge und Textil? Der schnelle Vergleich mit Entscheidungshilfe.',
    sections: [
      { h: 'Die wichtigsten Verfahren im Überblick', p: ['Für Textilien kommen vor allem vier Verfahren infrage. Sie unterscheiden sich in Optik, Haltbarkeit, Farbanzahl und darin, ab welcher Menge sie sich lohnen.'],
        list: ['Stick: Das Logo wird mit Garn eingestickt. Sehr edel und extrem langlebig – ideal für Polos, Hemden, Jacken, Caps und Handtücher.', 'Siebdruck: Farbe wird durch ein Sieb auf das Textil gedruckt. Leuchtende, sehr haltbare Farben; lohnt sich ab etwa 25–50 Stück, weil pro Farbe ein Sieb angelegt wird.', 'Digitaltransfer (DTF): Das Motiv wird gedruckt und aufgepresst. Fotos und Farbverläufe sind möglich, schon ab 1 Stück wirtschaftlich.', 'Flex und Flock: Folie wird geschnitten und aufgepresst. Perfekt für Namen und Nummern auf Trikots und Teamwear.'] },
      { h: 'Entscheidungshilfe in drei Fragen', p: ['1. Wie viele Teile? Für Einzelteile und kleine Mengen sind Digitaltransfer und Flex am günstigsten. Ab etwa 30 Teilen mit gleichem Motiv wird Siebdruck interessant.', '2. Welches Textil? Auf Polos, Hemden, Fleece und Softshell wirkt Stick hochwertig und hält länger als jeder Druck. Auf T-Shirts und Hoodies mit großem Rückenmotiv ist Druck die bessere Wahl.', '3. Wie sieht das Motiv aus? Feine Schriften unter etwa 4 mm Höhe und Farbverläufe lassen sich nicht sauber sticken – hier ist Druck besser. Kräftige, flächige Logos mit wenigen Farben eignen sich für beides.'] },
      { h: 'Was kostet die Veredelung?', p: ['Beim Stick fällt einmalig ein Stickprogramm für Ihr Logo an, danach zahlen Sie pro Teil nach Stichzahl. Bei Nachbestellungen nutzen wir das Programm erneut. Beim Siebdruck gibt es einmalige Sieb- und Einrichtekosten pro Farbe. Digitaltransfer wird nach Motivgröße berechnet und hat praktisch keine Einrichtekosten. Alle Kosten stehen transparent als eigene Positionen in Ihrem Angebot.'] },
    ],
    faq: [['Kann ich Stick und Druck kombinieren?', 'Ja, sehr beliebt: Logo als Stick auf der Brust, großes Motiv oder Namen als Druck auf dem Rücken.'], ['Ab wie vielen Teilen lohnt sich Stick?', 'Stick ist ab 1 Stück möglich. Wegen des einmaligen Stickprogramms wird er ab etwa 10 Teilen pro Stück deutlich günstiger.'], ['Welche Datei brauche ich?', 'Am besten eine Vektordatei (AI, EPS, PDF oder SVG). Eine gut aufgelöste PNG-Datei funktioniert für Digitaltransfer meist auch.']],
    links: [['/druck-stick', 'Alle Verfahren im Vergleich'], ['/poloshirts', 'Poloshirts zum Besticken'], ['/kontakt', 'Beratung anfragen']],
  },
  {
    slug: 'logo-datei-vorbereiten', icon: '🎨', minutes: 3,
    title: 'Logo-Datei für Druck und Stick richtig vorbereiten',
    description: 'Welches Dateiformat, welche Auflösung, welche Farben? So bereiten Sie Ihr Logo für Textildruck und Stick optimal vor.',
    teaser: 'Vektor oder Pixel, Farben, Mindestgrößen: Mit diesen Tipps sieht Ihr Logo auf dem Textil perfekt aus.',
    sections: [
      { h: 'Das ideale Dateiformat', p: ['Vektordateien sind beliebig skalierbar und bleiben immer scharf. Sie sind die beste Grundlage für Siebdruck, Flex und Stick.'], list: ['Optimal: AI, EPS, PDF (mit Vektoren) oder SVG', 'Gut: PNG mit transparentem Hintergrund, mindestens 300 dpi in Druckgröße', 'Ungeeignet: kleine JPGs aus E-Mail-Signaturen oder Screenshots von der Website'] },
      { h: 'Farben richtig angeben', p: ['Bildschirme zeigen Farben unterschiedlich an. Wenn Ihr Logo eine feste Hausfarbe hat, nennen Sie uns am besten die Pantone- oder HKS-Nummer. Beim Stick wählen wir den passenden Garnton aus der Farbkarte des Herstellers; kleine Abweichungen sind verfahrensbedingt normal.'] },
      { h: 'Mindestgrößen beachten', p: ['Damit Details lesbar bleiben, sollten Schriften im Stick mindestens 4–5 mm hoch sein, Linien mindestens 1 mm dick. Im Druck sind feinere Details möglich. Für ein Brustlogo sind 8–10 cm Breite üblich, für ein Rückenmotiv bis etwa 30 cm.'] },
      { h: 'Sie haben keine passende Datei?', p: ['Kein Problem: Schicken Sie uns, was Sie haben – auch ein Foto oder ein PDF vom Briefkopf. Wir prüfen die Datei und sagen Ihnen, ob sie reicht oder ob eine Aufbereitung sinnvoll ist. Vor der Produktion erhalten Sie immer eine Vorschau zur Freigabe.'] },
    ],
    faq: [['Muss mein Logo einen transparenten Hintergrund haben?', 'Für den Druck ja – sonst wird ein weißer Kasten mitgedruckt. Bei Vektordateien ist das automatisch der Fall.'], ['Kann ich ein Logo von meiner Website verwenden?', 'Meist ist die Auflösung zu gering. Fragen Sie Ihre Agentur oder Druckerei nach der Original-Vektordatei.']],
    links: [['/ratgeber/druck-oder-stick', 'Druck oder Stick?'], ['/kontakt', 'Logo prüfen lassen']],
  },
  {
    slug: 'grammatur-und-material', icon: '📏', minutes: 3,
    title: 'Grammatur und Material: woran Sie gute Textilien erkennen',
    description: 'Was bedeutet g/m²? Baumwolle, Polyester oder Mischgewebe? So wählen Sie T-Shirts, Polos und Hoodies in der passenden Qualität.',
    teaser: 'Was g/m² aussagt und welches Material sich für welchen Einsatz eignet – kompakt erklärt.',
    sections: [
      { h: 'Was die Grammatur aussagt', p: ['Die Grammatur gibt an, wie viel ein Quadratmeter Stoff wiegt. Je höher der Wert, desto dichter und meist robuster ist das Textil.'], list: ['T-Shirts: 140–160 g/m² leicht und luftig (Promotion, Events), 180–220 g/m² hochwertig und formstabil', 'Poloshirts: 180–220 g/m², Piqué-Gewebe ist atmungsaktiv', 'Sweatshirts und Hoodies: 260–300 g/m² Standard, ab 300 g/m² besonders wertig'] },
      { h: 'Baumwolle, Polyester oder Mischgewebe?', p: ['100 % Baumwolle ist angenehm auf der Haut und ideal für Druck. Polyester trocknet schnell, ist formstabil und knitterarm – gut für Sport und Arbeitskleidung. Mischgewebe (z. B. 65/35) verbinden beides und halten häufigem Waschen besser stand. Bio-Baumwolle und recycelte Fasern sind eine gute Wahl, wenn Nachhaltigkeit wichtig ist; achten Sie auf Siegel wie GOTS oder OEKO-TEX.'] },
      { h: 'Der richtige Artikel für den Einsatz', p: ['Für ein Sommerfest reicht ein leichtes T-Shirt. Für Teamkleidung, die jeden Tag getragen und oft gewaschen wird, lohnt sich eine schwerere Qualität oder ein Mischgewebe. In Handwerk und Gastronomie zahlen sich industriewäschetaugliche Artikel aus.'] },
    ],
    faq: [['Läuft Baumwolle beim Waschen ein?', 'Vorgeschrumpfte Qualitäten kaum. Waschen Sie veredelte Textilien auf links und bei der angegebenen Temperatur.'], ['Was bedeutet ringgesponnen?', 'Die Fasern werden zusätzlich verdreht. Das Garn ist feiner und glatter – das Shirt fühlt sich weicher an und lässt sich schärfer bedrucken.']],
    links: [['/t-shirts', 'T-Shirts ansehen'], ['/sweatshirts', 'Sweatshirts & Hoodies'], ['/poloshirts', 'Poloshirts']],
  },
  {
    slug: 'teamkleidung-bestellen', icon: '👕', minutes: 4,
    title: 'Teamkleidung bestellen: Checkliste für Verein und Firma',
    description: 'Größen sammeln, Budget planen, Namen und Nummern: Die Schritt-für-Schritt-Checkliste für Vereinskleidung und Firmenbekleidung.',
    teaser: 'Von der Größenabfrage bis zur Nachbestellung – so läuft die Teambestellung ohne Stress.',
    sections: [
      { h: '1. Bedarf und Budget klären', p: ['Wer bekommt was – und wofür? Für Training und Alltag eignen sich T-Shirts und Hoodies, für Kundenkontakt Polos und Hemden, für draußen Softshell- und Fleecejacken. Legen Sie ein Budget pro Person fest; Staffelpreise ab 10 Stück pro Artikel senken die Kosten spürbar.'] },
      { h: '2. Größen sammeln', p: ['Sammeln Sie die Größen am besten in einer einfachen Liste mit Name, Artikel, Farbe und Größe. Größentabellen der Hersteller finden Sie bei jedem Artikel. Im Zweifel lieber eine Nummer größer bestellen – vor allem bei Baumwolle.'] },
      { h: '3. Logo und Positionen festlegen', p: ['Klassisch ist das Logo auf der linken Brust, ergänzt um Namen, Funktion oder Sponsor auf Rücken oder Ärmel. Bei Trikots kommen Nummern dazu. Tragen Sie Namen und Nummern einfach im Hinweisfeld der Veredelung ein oder schicken Sie uns Ihre Liste.'] },
      { h: '4. Bestellen, freigeben, nachbestellen', p: ['Nach Ihrer Anfrage erhalten Sie ein Angebot, vor der Produktion eine Vorschau. Neue Mitglieder oder Mitarbeitende? Mit „Nachbestellen“ im Kundenkonto bestellen Sie dieselben Artikel mit gleichem Logo erneut – ohne alles neu einzugeben.'] },
    ],
    faq: [['Gibt es eine Mindestmenge?', 'Nein, alle Artikel gibt es schon ab 1 Stück – ideal für Nachbestellungen.'], ['Können Mitglieder einzeln bestellen?', 'Ja. Auf Wunsch richten wir einen eigenen Vereinszugang mit Ihrer Kollektion und Ihrem Logo ein.']],
    links: [['/fuer/vereine', 'Für Vereine'], ['/fuer/unternehmen', 'Für Unternehmen'], ['/registrieren', 'Kundenkonto anlegen']],
  },
  {
    slug: 'arbeitskleidung-mit-logo', icon: '🛠️', minutes: 3,
    title: 'Arbeitskleidung mit Logo: worauf Handwerk und Gastro achten sollten',
    description: 'Robust, waschbar, gut sichtbar: Tipps für Arbeitskleidung, Kochjacken und Schürzen mit Firmenlogo in Handwerk und Gastronomie.',
    teaser: 'Waschtemperaturen, Materialien und Veredelung, die den Arbeitsalltag aushalten.',
    sections: [
      { h: 'Waschbarkeit zuerst', p: ['Arbeitskleidung wird oft und heiß gewaschen. Achten Sie auf die Pflegeangabe des Herstellers (z. B. 60 °C oder industriewäschetauglich). Gestickte Logos überstehen häufiges Waschen am besten; Drucke sollten für die gewünschte Temperatur geeignet sein.'] },
      { h: 'Das passende Material', p: ['Mischgewebe aus Polyester und Baumwolle sind strapazierfähig, knitterarm und trocknen schnell. Für die Küche eignen sich Kochjacken und Schürzen aus robustem Baumwoll-Mischgewebe, für draußen Softshell und Fleece.'] },
      { h: 'Einheitlicher Auftritt', p: ['Ein Logo, eine Farbe, wiedererkennbar auf jedem Teil: Legen Sie eine kleine Kollektion fest, die jederzeit nachbestellt werden kann. In Ihrem persönlichen Kundenzugang hinterlegen wir Logo und Artikel – neue Mitarbeitende sind in wenigen Klicks ausgestattet.'] },
    ],
    faq: [['Ist bedruckte Kleidung als Arbeitskleidung steuerlich absetzbar?', 'Das hängt vom Einzelfall ab – bitte sprechen Sie dazu mit Ihrem Steuerberater.'], ['Gibt es Warnschutzkleidung?', 'Fragen Sie uns gerne an – wir prüfen die Verfügbarkeit passender Artikel.']],
    links: [['/fuer/handwerk', 'Für Handwerk'], ['/fuer/gastronomie', 'Für Gastronomie'], ['/arbeitskleidung', 'Arbeitskleidung ansehen']],
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug) ?? null;
