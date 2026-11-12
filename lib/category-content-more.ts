// Texte für die neuen Kategorien (Katalog Herbst 2026) und für alle Unterkategorien
type C = { intro: string; seo: string[]; faq: [string, string][] };

export const T_MORE: Record<string, Partial<C>> = {
  'taschen-rucksaecke': {
    intro: 'Rucksäcke, Shopper, Sport- und Reisetaschen mit Ihrem Logo – Werbeträger, die jeden Tag mit unterwegs sind.',
    seo: ['Taschen gehören zu den wirkungsvollsten Werbemitteln überhaupt: Sie werden täglich benutzt und tragen Ihr Logo durch Büro, Stadt, Uni und Urlaub. Von der günstigen Baumwolltasche für die Messe über nachhaltige Jute-Shopper bis zum Laptoprucksack für das Onboarding-Paket finden Sie hier die passende Tasche für jedes Budget.', 'Große, flache Flächen wie bei Shoppern sind ideal für Siebdruck oder Transferdruck. Rucksäcke und Reisetaschen wirken mit einem Stick auf der Fronttasche besonders hochwertig. Viele Modelle haben ein Abreißetikett – praktisch für eigene Labels.'],
    faq: [['Welche Tasche eignet sich als Giveaway?', 'Für Messen und Aktionen sind Baumwoll- und Jutetaschen ideal: günstig, nachhaltig und mit großer Druckfläche. Für Mitarbeitende und Kunden eignen sich Rucksäcke oder Reisetaschen als hochwertiges Präsent.'], ['Kann ich Taschen besticken lassen?', 'Ja – Rucksäcke, Sport- und Reisetaschen lassen sich meist auf der Vortasche besticken. Dünne Stofftaschen bedrucken wir.'], ['Ab welcher Menge lohnt sich Siebdruck?', 'Ab etwa 50 Stück mit einem gleichbleibenden Motiv ist Siebdruck oft am günstigsten. Für kleinere Mengen ab 1 Stück verwenden wir Transferdruck.']],
  },
  schirme: {
    intro: 'Regenschirme mit Logo – vom Taschenschirm bis zum großen Gäste- und Golfschirm mit Windproof-System.',
    seo: ['Ein Schirm bietet eine der größten Werbeflächen unter den Werbemitteln und wird genau dann gezeigt, wenn viele Menschen unterwegs sind. Große Gäste- und Golfschirme eignen sich für Hotels, Autohäuser und Golfclubs, Taschenschirme sind ideal als Kunden- und Mitarbeitergeschenk.', 'Bedruckt werden einzelne oder mehrere Segmente; viele Modelle haben zusätzlich einen Griff mit Werbeanbringung. Windproof-Systeme mit Fiberglasschienen sorgen dafür, dass der Schirm auch bei Böen hält.'],
    faq: [['Wie viele Segmente kann ich bedrucken lassen?', 'Je nach Modell ein bis alle Segmente. Häufig wird ein Segment mit dem Logo und das gegenüberliegende mit der Webadresse bedruckt.'], ['Welcher Schirm ist am robustesten?', 'Modelle mit Windproof-System und Fiberglasschienen geben bei Böen nach, statt zu brechen – erkennbar am Hinweis „Windproof“ oder „Windmatic“.']],
  },
  'gastro-kueche': {
    intro: 'Schürzen, Kochjacken und Servicekleidung mit Ihrem Logo – für Restaurant, Café, Bäckerei, Hofladen und Catering.',
    seo: ['In der Gastronomie ist die Kleidung des Teams Teil des Konzepts: Schürzen in Jeans-Optik passen zum Burgerladen, schlichte Bistroschürzen zum Café, weiße Kochjacken zur Profiküche. Alle Artikel sind für den täglichen Einsatz gemacht und lassen sich häufig waschen.', 'Ein gesticktes Logo auf dem Latz oder der Brust wirkt besonders hochwertig und hält auch häufigen Wäschen stand. Namen des Teams lassen sich zusätzlich aufbringen.'],
    faq: [['Welche Schürze passt zu meinem Betrieb?', 'Latzschürzen schützen am meisten (Küche, Grill), Bistroschürzen sind elegant für den Service, Vorbinder und Hüftschürzen sind leicht und ideal für Bar und Theke.'], ['Sind die Artikel waschbar bei hohen Temperaturen?', 'Das ist je Artikel angegeben – viele Schürzen und Kochjacken sind für 60 °C oder mehr ausgelegt.']],
  },
  warnschutz: {
    intro: 'Warnwesten und Warnschutzkleidung nach EN ISO 20471 – mit Firmenlogo oder Aufdruck wie „Ordner“ und „Security“.',
    seo: ['Warnschutz macht Menschen sichtbar – auf der Baustelle, im Straßenverkehr, in Logistik und bei Veranstaltungen. Achten Sie auf die Schutzklasse: Klasse 1 und 2 sind für viele Einsätze ausreichend, für Arbeiten an Straßen wird oft Klasse 2 oder 3 gefordert.', 'Logos und Schriftzüge werden auf den nicht reflektierenden Flächen angebracht, damit die Schutzwirkung erhalten bleibt. Bedruckbare „Easy Print“-Modelle sind dafür besonders gut geeignet.'],
    faq: [['Darf ich Warnwesten bedrucken?', 'Ja, solange die reflektierenden Streifen und die Mindestfläche des fluoreszierenden Materials frei bleiben. Wir platzieren Ihr Motiv entsprechend.'], ['Welche Größe brauche ich?', 'Warnwesten werden über der Kleidung getragen – im Zweifel eine Größe größer wählen.']],
  },
  'pluesch-spielzeug': {
    intro: 'Plüschfiguren, Quietsche-Enten und Knautschtiere – sympathische Werbeartikel, die garantiert nicht im Papierkorb landen.',
    seo: ['Plüsch und Quietsche-Enten sind Werbemittel mit Herz: Sie bleiben im Kinderzimmer, auf dem Schreibtisch oder im Badezimmer und erinnern lange an den Absender. Beliebt sind sie bei Messen, Kinderarztpraxen, Spendenaktionen und als Weihnachtsgeschenk.', 'Viele Figuren lassen sich mit einem Shirt, Halstuch oder Anhänger mit Ihrem Logo ausstatten. Die Artikel entsprechen der europäischen Spielzeugnorm EN71.'],
    faq: [['Sind die Artikel für Kinder geeignet?', 'Die Artikel sind nach EN71 geprüft. Altersangaben und Hinweise des Herstellers finden Sie auf der jeweiligen Artikelseite.'], ['Wie bringe ich mein Logo an?', 'Je nach Figur über ein bedrucktes Mini-Shirt, ein Halstuch, einen Anhänger oder die Verpackung. Wir beraten Sie gern.']],
  },
  handtuecher: {
    intro: 'Handtücher, Badetücher und Frottee mit gesticktem Logo oder Namen – für Hotel, Spa, Fitness und als Geschenk.',
    seo: ['Frottee-Artikel werden täglich benutzt und eignen sich deshalb hervorragend als Werbemittel und Geschenk. Die Grammatur verrät die Qualität: Ab etwa 450 g/m² ist Frottee besonders dicht, flauschig und saugstark, leichtere Qualitäten trocknen schneller.', 'Ein Stick wirkt auf Frottee besonders edel – ob Logo, Hotelname oder Vorname. Handtücher mit glatter Bordüre lassen sich zusätzlich bedrucken, Sublimationsartikel sogar vollflächig.'],
    faq: [['Kann ich Handtücher mit Namen besticken lassen?', 'Ja, jedes Handtuch kann einen eigenen Namen tragen – senden Sie uns einfach eine Namensliste.'], ['Was bedeutet die Grammatur?', 'Sie gibt das Gewicht pro Quadratmeter an. Je höher, desto dichter und flauschiger ist das Frottee.']],
  },
  werbeartikel: {
    intro: 'Praktische Werbeartikel mit Logo – von der Konferenzmappe bis zum Kissenbezug.',
    seo: ['Werbeartikel sind dann erfolgreich, wenn sie benutzt werden. Deshalb finden Sie hier praktische Begleiter für Büro, Zuhause und unterwegs, die sich mit Ihrem Logo veredeln lassen.'],
  },
  accessoires: {
    intro: 'Socken, Schals, Handschuhe, Krawatten und mehr – die Details, die einen Teamlook komplett machen.',
    seo: ['Accessoires sind kleine Teile mit großer Wirkung: Vereinsschals für die Fans, Socken im Teamdesign, Krawatten und Fliegen für den Service oder warme Handschuhe für Outdoor-Teams. Viele Artikel eignen sich auch hervorragend als Geschenk.'],
  },
  kleider: {
    intro: 'Kleider, Röcke und Jumpsuits – feminine Teile für Service, Events und Mode-Labels.',
    seo: ['Ob Shirtkleid für das Event-Team oder eleganter Rock für den Empfang: Kleider sind bequem und wirken gleichzeitig gepflegt. Ein kleines Logo auf der Brust oder im Nacken setzt einen dezenten Akzent.'],
  },
};

/** Unterkategorien: eigene Einleitung + kurzer SEO-Absatz */
export const SUB_TEXT: Record<string, { intro: string; seo?: string }> = {
  't-shirts-kurzarm': { intro: 'Kurzarm-T-Shirts mit Logo – die vielseitige Basis für Teams, Events und Merchandise.', seo: 'Vom günstigen Promo-Shirt bis zum schweren Premium-Shirt aus gekämmter Baumwolle: Kurzarm-T-Shirts sind das beliebteste Werbetextil. Für große Frontmotive eignet sich Siebdruck, für kleine Mengen Transferdruck.' },
  'langarm-long-shirts': { intro: 'Langarmshirts und Long-Shirts – die Teamshirts für Übergangszeit, Training und Arbeit.', seo: 'Langarmshirts bieten neben Brust und Rücken auch die Ärmel als Werbefläche – ideal für Webadresse oder Sponsoren.' },
  'tanktops-tops': { intro: 'Tanktops und Tops für Sport, Sommer-Events und Festivals.', seo: 'Tanktops sind luftig und sportlich – perfekt für Laufevents, Fitness-Teams und Sommerfeste.' },
  'cropped-shirts': { intro: 'Cropped Shirts – kurz geschnitten und modisch, ideal für Merch und Streetwear.' },
  'oversize-heavy-t-shirts': { intro: 'Oversize- und Heavy-T-Shirts – der lässige Streetwear-Look mit schwerer Qualität.', seo: 'Schwere Stoffe ab etwa 200 g/m² und ein weiter Schnitt machen diese Shirts zum Lieblingsteil für Merchandise, Bands und Labels.' },
  'klassische-poloshirts': { intro: 'Klassische Poloshirts – gepflegt im Kundenkontakt, bequem im Alltag.', seo: 'Piqué-Polos mit gesticktem Brustlogo sind der Klassiker für Empfang, Service, Handwerk und Messe.' },
  'oversize-heavy-poloshirts': { intro: 'Oversize- und Heavy-Poloshirts – das Polo im modernen Streetwear-Schnitt.' },
  kapuzenpullover: { intro: 'Kapuzenpullover mit Logo – das beliebteste Teamtextil für Verein, Firma und Abschlussjahrgang.', seo: 'Hoodies ab etwa 280 g/m² wirken hochwertig und formstabil. Großer Rückendruck, kleiner Stick auf der Brust oder Namen am Ärmel – Hoodies bieten viel Platz für Ideen.' },
  sweatjacken: { intro: 'Sweatjacken mit Reißverschluss – der flexible Lagenlook für Büro, Training und unterwegs.', seo: 'Auf Sweatjacken kommt das Logo meist links auf die Brust, der Rücken bietet Platz für große Schriftzüge.' },
  'sweatshirts-rundhals': { intro: 'Sweatshirts mit Rundhals – zeitlos, bequem und ideal für Druck und Stick.' },
  'oversize-cropped-sweatshirts': { intro: 'Oversize- und Cropped-Sweatshirts – angesagte Schnitte für Merchandise und Streetwear.', seo: 'Weite Schnitte und kurze Formen machen diese Sweats zu modischen Statements – perfekt für Labels, Bands und junge Teams.' },
  fleecejacken: { intro: 'Fleecejacken mit gesticktem Logo – warm, leicht und robust für draußen und drinnen.', seo: 'Antipilling-Fleece bleibt lange schön. Ein Stick auf der Brust ist bei Fleece die erste Wahl.' },
  'westen-bodywarmer': { intro: 'Westen und Bodywarmer – warm am Körper, frei an den Armen.', seo: 'Ideal für Handwerk, Messe und Trainer: Westen geben Bewegungsfreiheit und tragen Ihr Logo auf Brust und Rücken.' },
  'stepp-winterjacken': { intro: 'Stepp- und Winterjacken für die kalte Jahreszeit – warm gefüttert und mit Ihrem Logo.', seo: 'Für Steppjacken empfehlen wir einen Stick über den Veredelungszugang, damit die Füllung nicht beschädigt wird.' },
  'windbreaker-regenjacken': { intro: 'Windbreaker, Regen- und Softshelljacken – Schutz bei wechselhaftem Wetter.', seo: 'Leichte Jacken sind ideal für Events, Laufgruppen und Outdoor-Teams. Logos werden meist per Stick oder speziellen Transferfolien aufgebracht.' },
  'college-bomberjacken': { intro: 'College- und Bomberjacken – der sportliche Kultklassiker für Teams und Merch.' },
  'jogging-sweathosen': { intro: 'Jogging- und Sweathosen – bequem für Training, Anreise und Freizeit.', seo: 'Passend zum Hoodie ergibt die Jogginghose einen kompletten Teamlook. Ein kleines Logo am Oberschenkel genügt.' },
  'shorts-radlerhosen': { intro: 'Shorts und Radlerhosen für Sport, Sommer und Freizeit.' },
  leggings: { intro: 'Leggings für Sport, Yoga und Fitness-Teams.' },
  'arbeits-stoffhosen': { intro: 'Arbeits- und Stoffhosen – robust für den Einsatz oder gepflegt fürs Büro.' },
  'socken-stulpen': { intro: 'Socken und Stulpen – für Sport, Teams und als witziges Merch.' },
  'schals-tuecher': { intro: 'Schals, Tücher und Multifunktionstücher – warm, praktisch und ideal als Fanartikel.' },
  handschuhe: { intro: 'Handschuhe für Winter, Outdoor und Arbeit.' },
  'krawatten-fliegen': { intro: 'Krawatten, Fliegen und Hosenträger – der elegante Abschluss für Service und Events.' },
  taschen: { intro: 'Kleine Taschen und Accessoires für unterwegs.' },
  caps: { intro: 'Caps mit gesticktem Logo – Baseball, Snapback, Trucker und Dad Caps.', seo: 'Auf der Front von Caps wirkt ein Stick besonders plastisch und edel. Seitliche oder hintere Motive ergänzen das Design – etwa die Webadresse über dem Verschluss.' },
  'muetzen-beanies': { intro: 'Mützen und Beanies – das beliebteste Winter-Giveaway für Team und Kunden.', seo: 'Strickmützen werden am besten bestickt – vorne mittig oder auf dem Umschlag. Thinsulate-Modelle halten besonders warm.' },
  'huete-fischerhuete': { intro: 'Hüte und Fischerhüte – der Trend für Sommer, Festival und Merchandise.' },
  rucksaecke: { intro: 'Rucksäcke mit Logo – für Büro, Uni, Sport und Reise.', seo: 'Ob Laptoprucksack für das Onboarding oder Outdoor-Rucksack für das Team-Event: Rucksäcke sind täglich unterwegs und damit ideale Werbeträger.' },
  'einkaufs-stofftaschen': { intro: 'Einkaufs- und Stofftaschen – nachhaltige Werbung bei jedem Einkauf.', seo: 'Baumwoll- und Jutetaschen ersetzen Plastiktüten und tragen Ihr Logo hundertfach durch die Stadt – ideal für Messe, Einzelhandel und Stadtmarketing.' },
  'reise-sporttaschen': { intro: 'Reise- und Sporttaschen – für Training, Auswärtsspiel und Dienstreise.', seo: 'Mit Vereinswappen und Spielername wird die Sporttasche zum Gemeinschaftsstück des ganzen Teams.' },
  'laptop-dokumententaschen': { intro: 'Laptop- und Dokumententaschen für Büro und Außendienst.' },
  kuehltaschen: { intro: 'Kühltaschen und Lunchbags – frisch unterwegs mit Ihrem Logo.' },
  'hueft-kultur-kleintaschen': { intro: 'Hüft-, Kultur- und Kleintaschen – praktische Begleiter mit Werbefläche.' },
  schuerzen: { intro: 'Schürzen mit Logo – Latz-, Bistro- und Hüftschürzen für Gastronomie, Handel und Hobby.', seo: 'Latzschürzen schützen am meisten, Bistroschürzen wirken elegant im Service. Gestickt hält das Logo auch häufigen Wäschen stand.' },
  'koch-servicekleidung': { intro: 'Kochjacken, Kochhosen und Servicekleidung für die Profiküche.' },
  warnwesten: { intro: 'Warnwesten nach EN ISO 20471 – mit Firmenname oder Aufdruck wie „Ordner“.', seo: 'Warnwesten sind Pflicht im Kfz und Standard auf Baustelle und Veranstaltung. Bedruckbare Modelle tragen Ihr Logo, ohne die Schutzwirkung zu beeinträchtigen.' },
  warnschutzkleidung: { intro: 'Warnschutz-Shirts, -Polos, -Pullover und -Jacken für den täglichen Einsatz.' },
  'quietsche-enten': { intro: 'Quietsche-Enten – der fröhlichste Werbeartikel für Messe, Hotel und Fans.' },
  'pluesch-knautschtiere': { intro: 'Plüsch- und Knautschtiere – kuschelige Sympathieträger für Ihre Marke.' },
  'stock-gaesteschirme': { intro: 'Stock-, Gäste- und Golfschirme – große Werbefläche, robust bei Wind.' },
  taschenschirme: { intro: 'Taschenschirme – klein, leicht und immer dabei.' },
};
