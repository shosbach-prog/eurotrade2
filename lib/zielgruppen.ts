/** Branchen-Seiten: nur Leistungen, die es im Shop tatsächlich gibt */
export type Zielgruppe = { slug: string; nav: string; teaser: string; dativ: string; title: string; h1: string; lead: string; desc: string; cats: string[]; points: [string, string][]; faq: [string, string][]; example: string };

export const ZIELGRUPPEN: Zielgruppe[] = [
  {
    slug: 'vereine', dativ: 'Vereinen', teaser: 'Teamwear mit Vereinslogo, Namen und Nummern – ab 1 Stück nachbestellbar.', nav: 'Vereine', title: 'Vereinskleidung mit Logo bedrucken & besticken',
    h1: 'Vereinskleidung mit Ihrem Vereinslogo',
    lead: 'T-Shirt, Hoodie, Polo oder Cap: Wir bringen Ihr Vereinslogo auf Markentextilien – schon ab einem Stück und mit Namen und Nummern auf Wunsch.',
    desc: 'Vereinskleidung und Teamwear mit Vereinslogo: Hoodies, T-Shirts, Polos, Jacken und Caps – bedruckt oder bestickt ab 1 Stück, mit Namen und Nummern. Angebot in 24 Stunden.',
    cats: ['sweatshirts', 't-shirts', 'poloshirts', 'jacken', 'caps-muetzen'],
    points: [
      ['Namen & Nummern', 'Individuelle Rückennamen und Nummern per Flex-Transfer – einfach als Liste mitschicken.'],
      ['Nachbestellen ab 1 Stück', 'Neue Mitglieder? Einzelteile lassen sich jederzeit nachbestellen, mit demselben Motiv.'],
      ['Eigener Vereinsshop', 'Ihre Kollektion und Ihr Logo hinterlegt – Mitglieder bestellen aus einer gemeinsamen Auswahl.'],
      ['Staffelpreise', 'Je mehr Teile, desto günstiger der Stückpreis – Rabattstaffel ab 10 Stück.'],
    ],
    faq: [
      ['Können Mitglieder selbst bestellen?', 'Ja. Mit einem Vereinscode sehen Mitglieder Ihre Kollektion mit Ihrem Logo und können selbst Anfragen stellen.'],
      ['Gibt es eine Mindestmenge?', 'Nein. Mit Digitaltransfer oder Flex veredeln wir schon ab einem Stück. Für Stick lohnt sich meist eine Menge ab etwa 10 Teilen.'],
      ['Wie lange dauert die Lieferung?', 'Nach Ihrer Freigabe des Motivs meist 7–14 Werktage.'],
    ],
    example: 'z. B. 30 Hoodies mit Vereinslogo vorne und Namen hinten',
  },
  {
    slug: 'unternehmen', dativ: 'Unternehmen', teaser: 'Polos, Hemden und Jacken mit gesticktem Logo – mit eigenem Firmenshop.', nav: 'Unternehmen', title: 'Firmenbekleidung mit Logo – Corporate Fashion',
    h1: 'Firmenbekleidung mit Ihrem Logo',
    lead: 'Einheitlicher Auftritt für Ihr Team: Polos, Hemden, Blusen, Sweatshirts und Jacken – edel bestickt oder bedruckt, mit persönlichem Firmenshop.',
    desc: 'Firmenbekleidung und Corporate Fashion mit Logo: Polos, Hemden, Blusen, Sweatshirts und Jacken bestickt oder bedruckt – ab 1 Stück, eigener Firmenshop, Angebot in 24 Stunden.',
    cats: ['poloshirts', 'hemden-blusen', 'sweatshirts', 'jacken', 't-shirts'],
    points: [
      ['Stick für den edlen Auftritt', 'Langlebig und hochwertig – ideal für Polos, Hemden und Jacken im Kundenkontakt.'],
      ['Ihr Firmenshop', 'Logo, Kollektion und Ihre Konditionen hinterlegt. Neue Mitarbeitende einfach nachbestellen.'],
      ['Angebot als PDF', 'Alle Positionen transparent: Textil, Veredelung, Versand – online mit einem Klick annehmen.'],
      ['Ein Ansprechpartner', 'Persönliche Betreuung von der Anfrage bis zur Lieferung.'],
    ],
    faq: [
      ['Können wir die Kollektion festlegen?', 'Ja. Wir hinterlegen Ihre Auswahl im Firmenshop – auf Wunsch sehen Ihre Mitarbeitenden nur diese Artikel.'],
      ['Gibt es Rechnungskauf?', 'Die Zahlungsbedingungen stehen in Ihrem Angebot. Sprechen Sie uns an, wenn Sie besondere Wünsche haben.'],
      ['Treffen Sie unsere Firmenfarben?', 'Nennen Sie uns Ihre Pantone- oder HKS-Farben, dann stimmen wir Druck und Stick darauf ab.'],
    ],
    example: 'z. B. 15 Polos mit gesticktem Logo auf der Brust',
  },
  {
    slug: 'handwerk', dativ: 'Handwerksbetrieben', teaser: 'Arbeitskleidung mit Firmenlogo, robust bestickt oder bedruckt.', nav: 'Handwerk', title: 'Arbeitskleidung mit Logo für Handwerksbetriebe',
    h1: 'Arbeitskleidung mit Ihrem Firmenlogo',
    lead: 'Robuste Kleidung für Baustelle und Werkstatt, mit Ihrem Logo – damit Ihre Kunden sehen, wer bei ihnen arbeitet.',
    desc: 'Arbeitskleidung mit Logo für Handwerksbetriebe: Arbeitskleidung, T-Shirts, Sweatshirts, Jacken und Hosen – bestickt oder bedruckt ab 1 Stück. Angebot in 24 Stunden.',
    cats: ['arbeitskleidung', 't-shirts', 'sweatshirts', 'jacken', 'hosen'],
    points: [
      ['Stick übersteht viel', 'Gestickte Logos sind sehr langlebig und überstehen auch häufiges Waschen.'],
      ['Werbung, die mitfährt', 'Großes Logo auf dem Rücken, Webadresse oder Telefonnummer im Nacken.'],
      ['Ab 1 Stück', 'Für den Ein-Mann-Betrieb genauso wie für das ganze Team.'],
      ['Nachbestellung leicht gemacht', 'Ihr Motiv bleibt gespeichert – neue Teile mit demselben Logo jederzeit.'],
    ],
    faq: [
      ['Welche Veredelung hält am längsten?', 'Für Arbeitskleidung empfehlen wir meist Stick. Für große Rückenmotive ist Druck oft die günstigere Wahl – wir beraten Sie.'],
      ['Kann die Telefonnummer mit drauf?', 'Ja. Jeder Schriftzug ist möglich, z. B. im Nacken oder unter dem Logo auf dem Rücken.'],
      ['Haben Sie auch Hosen?', 'Ja, im Sortiment finden Sie auch Hosen. Sagen Sie uns, was Sie brauchen, dann stellen wir Ihnen eine Auswahl zusammen.'],
    ],
    example: 'z. B. 8 Sweatjacken mit Logo auf Brust und Rücken',
  },
  {
    slug: 'gastronomie', dativ: 'Gastronomie & Hotels', teaser: 'Hemden, Blusen und Polos mit Logo für Service, Küche und Rezeption.', nav: 'Gastronomie', title: 'Gastro- & Hotelbekleidung mit Logo',
    h1: 'Bekleidung mit Logo für Gastronomie & Hotel',
    lead: 'Gepflegter Auftritt für Service, Küche und Rezeption: Hemden, Blusen, Polos und T-Shirts mit Ihrem Logo.',
    desc: 'Gastronomie- und Hotelbekleidung mit Logo: Hemden, Blusen, Polos und T-Shirts – bestickt oder bedruckt ab 1 Stück. Angebot in 24 Stunden.',
    cats: ['hemden-blusen', 'poloshirts', 't-shirts', 'caps-muetzen'],
    points: [
      ['Dezent oder auffällig', 'Kleines Stick-Logo auf der Brust oder großes Motiv für Events – passend zu Ihrem Konzept.'],
      ['Saisonkräfte? Kein Problem', 'Nachbestellung ab 1 Stück, mit demselben Motiv.'],
      ['Einheitliches Team', 'Farben und Schnitte für Damen und Herren, aufeinander abgestimmt.'],
      ['Angebot in 24 Stunden', 'Anfrage schicken, Angebot als PDF erhalten, online annehmen.'],
    ],
    faq: [
      ['Gibt es Damen- und Herrenschnitte?', 'Bei vielen Artikeln ja. Wir zeigen Ihnen passende Kombinationen.'],
      ['Wie wasche ich bestickte Hemden?', 'Auf links gedreht bei der angegebenen Temperatur waschen und nicht direkt auf dem Stick bügeln.'],
      ['Können wir vorab ein Muster sehen?', 'Ja. Kreuzen Sie bei der Preisanfrage einfach „Muster gewünscht“ an.'],
    ],
    example: 'z. B. 12 Blusen und Hemden mit gesticktem Logo',
  },
];
export const zielgruppe = (slug: string) => ZIELGRUPPEN.find((z) => z.slug === slug);
