import { SUB_TEXT, T_MORE } from './category-content-more';
// Texte für Kategorieseiten (Einleitung, SEO-Text, FAQ) – je Kategorie anpassbar
type C = { intro: string; seo: string[]; faq: [string, string][] };
const T: Record<string, Partial<C>> = {
  hosen: { intro: 'Jogginghosen und Stoffhosen für Team, Freizeit und Business – bequem, robust und passend zum Oberteil mit Ihrem Logo.', seo: ['Eine passende Hose macht das Team-Outfit komplett: Jogginghosen aus Sweat-Qualität sind ideal für Anreise, Training und Freizeit, klassische Stoffhosen für den Auftritt im Büro oder am Empfang.', 'Für Logos auf Hosen eignen sich kleine Motive am Oberschenkel oder hinten – als Stick besonders langlebig. Kombinieren Sie die Hose mit einem Hoodie derselben Serie für einen einheitlichen Look.'] },
  unterwaesche: { intro: 'Sport- und Funktionsunterwäsche für Team und Training – atmungsaktiv und angenehm zu tragen.', seo: ['Funktionsunterwäsche transportiert Feuchtigkeit vom Körper weg und sorgt im Training für ein trockenes Hautgefühl. Achten Sie auf nahtarme Verarbeitung und die passende Größe – Funktionsware sollte eng anliegen.'] },
  sweatshirts: { intro: 'Hoodies, Sweatshirts und Zipper für Verein, Team und Firma – kuschelig, robust und ideal für Logo-Druck oder Stick.', seo: ['Ob Vereinshoodie, Firmen-Sweatshirt oder Zipper für die Crew: Sweatshirts sind die Allrounder unter den Teamtextilien. Achten Sie auf die Grammatur – ab etwa 280 g/m² wirken Hoodies hochwertig und formstabil, leichtere Qualitäten eignen sich für Frühling und Sommer.', 'Für Logos auf der Brust empfehlen wir Stick (edel, langlebig), für große Rückenmotive Siebdruck oder Digitaltransfer.'] },
  poloshirts: { intro: 'Poloshirts für Team, Service und Außendienst – gepflegt, pflegeleicht und perfekt für ein gesticktes Logo.', seo: ['Poloshirts verbinden einen professionellen Auftritt mit hohem Tragekomfort. Piqué-Qualitäten sind atmungsaktiv und formstabil, Mischgewebe mit Polyester trocknen schneller und knittern weniger – ideal für Gastronomie, Handwerk und Messe.', 'Klassiker ist ein gesticktes Logo auf der linken Brust; Namen oder Funktionen lassen sich zusätzlich auf dem Ärmel oder Rücken platzieren.'] },
  't-shirts': { intro: 'T-Shirts für Events, Vereine und Promotion – vom günstigen Basic bis zum Bio-Premium-Shirt.', seo: ['T-Shirts sind das beliebteste Werbetextil: günstig, vielseitig und ideal für große Auflagen. Für Events und Promotion reichen leichtere Qualitäten, für Merchandise und Teamwear lohnen sich schwerere, gekämmte Baumwollshirts.'] },
  jacken: { intro: 'Jacken, Fleece und Bodywarmer für draußen – wetterfest, funktional und mit Ihrem Logo ein starker Auftritt.', seo: ['Jacken sind langlebige Werbeträger und werden jahrelang getragen. Softshell schützt vor Wind und leichtem Regen, Fleece wärmt, Bodywarmer geben Bewegungsfreiheit. Für Logos auf Funktionsmaterial empfehlen wir Stick oder spezielle Transferfolien.'] },
  'caps-muetzen': { intro: 'Caps und Mützen – das kleine Teamtextil mit großer Wirkung, ideal mit gesticktem Logo.', seo: ['Caps und Beanies sind beliebte Giveaways und Merch-Artikel. Bestickt wirken Logos besonders plastisch und hochwertig.'] },
  'hemden-blusen': { intro: 'Hemden und Blusen für einen professionellen Auftritt im Büro, am Empfang und im Service.', seo: ['Bügelleichte Hemden und Blusen sind ideal für Teams mit Kundenkontakt. Ein dezent gesticktes Logo auf der Brust rundet den Auftritt ab.'] },
  decken: { intro: 'Kuscheldecken als hochwertiges Präsent für Kunden, Mitarbeitende und Vereinsmitglieder.', seo: ['Decken sind ein Geschenk mit langer Lebensdauer – ob für Stadion, Sofa oder Babyzimmer. Mit Stick oder Patch werden sie zum persönlichen Präsent.'] },
  arbeitskleidung: { intro: 'Arbeitskleidung, Kittel und Kasacks für Praxis, Pflege, Küche und Handwerk – robust und industriewäschetauglich.', seo: ['Berufsbekleidung muss viel aushalten. Achten Sie auf Waschtemperatur und Industriewäsche-Eignung; für Logos auf Arbeitskleidung empfehlen wir Stick.'] },
};
export function categoryContent(slug: string, name: string, sub?: string): C {
  const base = T[slug] ?? T_MORE[slug] ?? {};
  const st = sub ? SUB_TEXT[sub] : undefined;
  const t: Partial<C> = st ? { ...base, intro: st.intro, seo: [...(st.seo ? [st.seo] : []), ...(base.seo ?? [])] } : base;
  return {
    intro: t.intro ?? `${name} für Verein, Team und Firma – schon ab 1 Stück, auf Wunsch mit Ihrem Logo bedruckt oder bestickt.`,
    seo: t.seo ?? [`In unserer Kategorie ${name} finden Sie Markenqualität für Vereine, Unternehmen und Events. Alle Artikel sind schon ab 1 Stück erhältlich und lassen sich mit Logo, Text oder Namen veredeln.`],
    faq: t.faq ?? [
      [`Kann ich ${name} auch einzeln bestellen?`, 'Ja, alle Artikel gibt es schon ab 1 Stück. Ab 10 Stück greifen automatisch günstigere Staffelpreise – über alle Farben und Größen eines Artikels hinweg.'],
      ['Wie bekomme ich mein Logo auf den Artikel?', 'Wählen Sie am Artikel „Veredeln mit Logo oder Text“, laden Sie Ihr Logo hoch und wählen Sie Position und Verfahren. Vor der Produktion erhalten Sie eine Vorschau zur Freigabe.'],
      ['Wie schnell wird geliefert?', 'Unveredelte Ware in ca. 3–5 Werktagen, veredelte Ware in ca. 7–14 Werktagen nach Ihrer Freigabe.'],
      ['Kann ich unterschiedliche Größen und Farben mischen?', 'Ja. Tragen Sie einfach für jede Farbe die gewünschten Mengen je Größe ein – alles landet zusammen im Warenkorb und zählt gemeinsam für den Staffelpreis.'],
    ],
  };
}
