/**
 * Verkaufstexte aus den Produktdaten: Aufhänger je Artikelart, Material & Gefühl, Details,
 * Einsatz, Veredelung. Varianten werden pro Artikel stabil gewählt (gleicher Artikel = gleicher Text).
 * Es werden keine technischen Werte erfunden – alle Fakten stammen aus den Artikeldaten.
 */
import { BRAND_TEXTS } from './brand-texts';

type P = { id: string; sku: string; name: string; brand: string; category?: string; gender?: string; material?: string; composition?: string; features?: string[]; specs?: Record<string, string>; colors: { name: string }[]; sizes: string[]; description?: string };
export type Copy = { headline: string; intro: string; highlights: string[]; idealFor: string };

const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pick = <T,>(arr: T[], seed: string) => arr[hash(seed) % arr.length];
const clean = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim();
const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

/** Erstes Wort klein, wenn es ein Adjektiv vor einem Substantiv ist („Pflegeleichte Qualität“ → „pflegeleichte Qualität“) */
function lc(f: string) {
  const w = f.split(' ');
  if (/^(Der|Die|Das|Angenehm|Besonders|Extra|Sehr|Leicht|Super|Extrem|Ultra|Hoch|Mechanisch|Zertifiziert|Unbedruckt|Bedruckbar|Geeignet|Schnelltrocknend|Gepolstert|Verstärkt|Wasserabweisend|Wasserdicht|Atmungsaktiv|Abnehmbar|Verstellbar|Erhältlich|Ideal|Perfekt|Optimal)\b/.test(f) || /^[A-ZÄÖÜ][a-zäöüß]+-\s/.test(f)) return f[0].toLowerCase() + f.slice(1);
  if (w.length > 1 && /^[A-ZÄÖÜ][a-zäöüß-]+(e|er|es|en|em)$/.test(w[0]) && /^([A-ZÄÖÜ0-9]|[a-zäöü]+-$)/.test(w[1]) && !/^(Zwei|Drei|Vier)$/.test(w[0])) return w[0][0].toLowerCase() + f.slice(1);
  if (w.length > 1 && /^[A-ZÄÖÜ][a-zäöüß]+(e|er|es|en|em),?$/.test(w[0]) && /^[a-zäöüß]+(e|er|es|en|em)$/.test(w[1])) return f[0].toLowerCase() + f.slice(1);
  if (w.length === 1 && /(ig|lich|bar|isch|leicht|dicht|fest|frei|weich|stabil)$/.test(f)) return f.toLowerCase();
  if (/^(Zwei|Drei|Vier|Fünf|Sechs|Ein|Eine|Mit|Ohne|Aus|In|Für)\b/.test(f)) return f[0].toLowerCase() + f.slice(1);
  return f;
}
const list = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} und ${a[a.length - 1]}`);
const NOISE = /lieferung ohne|ist ein natürliches|psa|konformitätserklärung|gebrauchsanweisung|ean|altersempfehlung|achtung|geschmacksmuster|möglicherweise|massenbilanz|hinweis|nicht für kinder|kann in aussehen|^\d+\s*%|^bezug:|^material:|^kapazität|^länge|^maße|^gewicht/i;

type Kind = { re: RegExp; head: string[]; hook: string[]; use: string[]; deco: string[]; ideal: string; textile?: boolean };
const K: Record<string, Kind> = {
  warn: { re: /warnschutz|warnweste|warn-|hi-vis|sicherheitsjacke|reflektierend/i, textile: true,
    head: ['Gesehen werden – mit Ihrem Logo', 'Sicherheit, die auffällt', 'Leuchtend sicher, sichtbar markant'],
    hook: ['{dies} von {brand} sorgt dafür, dass Ihr Team gesehen wird – auf der Baustelle, im Straßenverkehr, beim Event-Aufbau oder an der Einlasskontrolle.', 'Wer draußen arbeitet, muss sichtbar sein. {Dies} von {brand} verbindet Warnschutz mit einer Fläche, die Ihre Marke gleich mitzeigt.'],
    use: ['Bau & Handwerk', 'Logistik & Lager', 'Ordner & Security', 'Events & Vereinsfeste', 'Kfz-Ausstattung'],
    deco: ['Auf Warnschutz kommt Ihr Logo am besten per Rückendruck oder kleinem Brustlogo – so bleibt die Schutzfläche frei und Ihr Firmenname ist schon von Weitem lesbar. Klassiker sind Aufdrucke wie „Ordner“, „Security“ oder der Firmenname auf dem Rücken.'],
    ideal: 'Baustelle, Logistik, Ordnerdienst, Event-Crew' },
  schuerze: { re: /schürze|vorbinder/i,
    head: ['Die Schürze, die Ihr Team trägt', 'Bereit für den Service', 'Gute Küche braucht gute Schürzen'],
    hook: ['{dies} von {brand} ist die Arbeitskleidung, die Gäste zuerst sehen: am Tresen, am Grill, an der Theke oder in der offenen Küche.', 'Ob Café, Bistro, Hofladen oder Werkstatt – mit {diesem} von {brand} sieht Ihr Team nach einem Team aus und die Kleidung darunter bleibt sauber.'],
    use: ['Gastronomie & Café', 'Bäckerei & Metzgerei', 'Hofladen & Markt', 'Grillabend & Hobbyküche', 'Werkstatt & Atelier'],
    deco: ['Logo, Restaurantname oder ein Spruch für den Grillmeister: Schürzen lassen sich auf dem Latz oder der Vorderseite hervorragend besticken oder bedrucken. Ein Stick wirkt besonders wertig und hält auch häufigen Wäschen stand.'],
    ideal: 'Gastronomie, Bäckerei, Hofladen, Grill-Geschenk' },
  koch: { re: /kochjacke|kochhemd|kochhose|kochmütze|koch-|kittel|kasack|tunika|skull cap|prep-hemd|chef/i, textile: true,
    head: ['Profi-Look für Küche und Service', 'Gemacht für den Küchenalltag', 'Sauberer Auftritt am Pass'],
    hook: ['{dies} von {brand} ist für den Alltag in Profiküche, Kantine und Service gemacht – dort, wo es heiß, hektisch und eng wird.', 'In der Küche zählt, dass Kleidung mitmacht. {Dies} von {brand} sieht professionell aus und ist für den täglichen Einsatz ausgelegt.'],
    use: ['Restaurant & Hotel', 'Kantine & Catering', 'Pflege & Praxis', 'Foodtruck & Imbiss'],
    deco: ['Ein gesticktes Logo auf der Brust ist in der Küche der Klassiker – dazu passt der Name des Kochs oder der Kollegin auf der anderen Seite. So wird aus Berufskleidung ein Markenauftritt.'],
    ideal: 'Profiküche, Hotel, Catering, Pflege' },
  schirm: { re: /schirm|erdspieß/i,
    head: ['Werbung, die bei jedem Wetter aufgeht', 'Ihr Logo, groß aufgespannt', 'Schutz von oben – mit Absender'],
    hook: ['Ein Schirm ist eines der Werbemittel mit der größten Sichtfläche: Bei jedem Regenschauer zeigt {dies} von {brand} Ihr Logo auf Augenhöhe – mitten in der Stadt, auf dem Golfplatz oder vor dem Hoteleingang.', '{dies} von {brand} wird nicht in der Schublade vergessen, sondern genutzt – und mit ihm Ihr Logo, Regentag für Regentag.'],
    use: ['Kundengeschenk', 'Hotel & Empfang', 'Messe & Events', 'Golfturnier', 'Mitarbeitergeschenk'],
    deco: ['Bedruckt wird meist ein Segment oder – für die große Wirkung – mehrere Segmente im Wechsel. Auch Griff oder Hülle können oft ein Logo tragen. Wir beraten Sie gern zur Anzahl der Segmente und zur Farbwahl.'],
    ideal: 'Kundengeschenk, Hotel, Messe, Golf' },
  ente: { re: /quietsche-ente|renn-ente|badeente/i,
    head: ['Quietschvergnügt in Erinnerung bleiben', 'Die kleinste Werbefläche mit dem größten Lächeln', 'Ente gut, alles gut'],
    hook: ['Kaum ein Werbeartikel zaubert so schnell ein Lächeln ins Gesicht wie eine Quietsche-Ente. {Dies} von {brand} wird gern behalten, aufs Regal gestellt oder weiterverschenkt – und erinnert lange an Sie.'],
    use: ['Messe-Giveaway', 'Kundengeschenk', 'Firmenjubiläum', 'Hotel-Badezimmer', 'Fanartikel'],
    deco: ['Die Ente selbst trägt bereits ihr Motiv – mit einem individuellen Aufdruck oder einer Banderole bzw. Verpackung wird sie zu Ihrem Botschafter. Sprechen Sie uns an, welche Branding-Möglichkeiten es für diesen Artikel gibt.'],
    ideal: 'Messe, Giveaway, Kundengeschenk, Jubiläum' },
  pluesch: { re: /plüsch|teddy|minifeet|schmoozies|squeezies|zippie|kuscheltuch|schlüsselanhänger|rentier|hundespielzeug/i,
    head: ['Zum Knuddeln und Behalten', 'Ein Geschenk, das in Erinnerung bleibt', 'Kuschelweich mit Botschaft'],
    hook: ['Plüschfiguren landen nicht im Papierkorb, sondern im Kinderzimmer, auf dem Schreibtisch oder im Auto. {Dies} von {brand} ist ein Sympathieträger, der Ihre Marke freundlich macht.', '{dies} von {brand} ist ein Werbeartikel mit Herz: weich, liebevoll gestaltet und ein Geschenk, über das sich Groß und Klein freuen.'],
    use: ['Kundengeschenk', 'Messe & Events', 'Kinderarzt & Kita', 'Spendenaktion', 'Weihnachten'],
    deco: ['Viele Plüschfiguren lassen sich mit einem Shirt, Halstuch oder Anhänger mit Ihrem Logo ausstatten. Wir zeigen Ihnen gern, welche Möglichkeit für diesen Artikel am besten passt.'],
    ideal: 'Kundengeschenk, Messe, Kinder, Spendenaktion' },
  handtuch: { re: /handtuch|badetuch|duschtuch|saunatuch|gästetuch|strandtuch|frottee|bademantel|poncho|waschhandschuh|seiftuch|duschvorleger|hamam|haarband|kapuzentuch|grubentuch/i,
    head: ['Weich, saugstark, mit Ihrem Namen', 'Ein Stück Wohlfühlen mit Logo', 'Frottee, das verbindet'],
    hook: ['{dies} von {brand} gehört zu den Werbemitteln, die jeden Tag benutzt werden – im Bad, im Fitnessstudio, im Spa oder am Strand.', 'Handtücher mit eingesticktem Namen oder Logo sind Geschenke, die bleiben. {Dies} von {brand} bringt Wohlfühlqualität in Hotel, Sportverein oder Firmenpräsent.'],
    use: ['Hotel & Spa', 'Fitnessstudio & Sportverein', 'Kundengeschenk', 'Geburt & Taufe', 'Strand & Urlaub'],
    deco: ['Auf Frottee wirkt ein Stick besonders edel – ob Logo, Hotelname oder ein persönlicher Vorname. Bei Artikeln für Sublimation ist sogar ein vollflächiger Fotodruck möglich.'],
    ideal: 'Hotel, Spa, Sportverein, Geschenk' },
  decke: { re: /decke|plaid|kissen/i,
    head: ['Kuschelzeit mit Absender', 'Warm, weich und wertig', 'Ein Geschenk für gemütliche Abende'],
    hook: ['{dies} von {brand} begleitet durch kalte Abende, aufs Sofa, ins Stadion oder zum Picknick – und Ihr Logo ist immer mit dabei.', 'Decken und Kissen sind Geschenke, die man gern benutzt. Mit {diesem} von {brand} schenken Sie ein Stück Gemütlichkeit.'],
    use: ['Kundengeschenk', 'Weihnachten', 'Stadion & Fans', 'Picknick & Outdoor', 'Mitarbeitergeschenk'],
    deco: ['Ein gesticktes Logo in der Ecke wirkt dezent und hochwertig, ein großes Motiv macht die Decke zum Fanartikel. Gern prüfen wir, welche Veredelung zum Material passt.'],
    ideal: 'Weihnachtsgeschenk, Fans, Kunden, Picknick' },
  kuehl: { re: /kühl|lunchbag|lunch/i,
    head: ['Kühl bleiben, auffallen', 'Frisch unterwegs – mit Ihrem Logo', 'Die Brotzeit hat jetzt einen Absender'],
    hook: ['{dies} von {brand} hält Getränke und Snacks frisch – beim Ausflug, auf der Baustelle, am See oder in der Mittagspause.'],
    use: ['Firmenevent & Sommerfest', 'Mitarbeitergeschenk', 'Picknick & Ausflug', 'Messe-Catering'],
    deco: ['Die Vorderseite bietet eine gut sichtbare Fläche für Ihr Logo – per Transferdruck oder Stick, je nach Material. Ideal als Sommer-Präsent für Team und Kunden.'],
    ideal: 'Sommerfest, Team-Ausflug, Kundengeschenk' },
  rucksack: { re: /rucksack|backpack|daypack/i,
    head: ['Ihr Logo auf jedem Weg', 'Gepackt für Alltag und Abenteuer', 'Der Rucksack, der überall mitkommt'],
    hook: ['Ein Rucksack ist täglich unterwegs – im Büro, an der Uni, auf Reisen oder Wanderungen. {Dies} von {brand} trägt Ihr Logo dorthin, wo Menschen sind.', '{dies} von {brand} ist ein Begleiter, der Tag für Tag genutzt wird – und damit eine der wirkungsvollsten Werbeflächen überhaupt.'],
    use: ['Mitarbeiter-Ausstattung', 'Onboarding-Paket', 'Schule & Uni', 'Vereinsfahrt', 'Kundengeschenk'],
    deco: ['Am besten kommt Ihr Logo auf der Vorderseite oder der Fronttasche zur Geltung – gestickt für einen wertigen Look oder per Transferdruck für mehrfarbige Motive.'],
    ideal: 'Onboarding, Team, Schule, Reisen' },
  reise: { re: /reisetasche|sporttasche|trolley|weekender|kit-bag|holdall|seesack|teamtasche|multisport|handgepäck|kleidersack|schuhbeutel|airporter|barrel/i,
    head: ['Bereit für Training und Reise', 'Packt alles – auch Ihren Auftritt', 'Unterwegs mit Teamgeist'],
    hook: ['{dies} von {brand} begleitet zum Training, zum Auswärtsspiel, auf Dienstreise oder ins Wochenende – robust, praktisch und mit Platz für alles Wichtige.', 'Für Vereine und Firmen ist {dies} von {brand} ein echtes Gemeinschaftsstück: Alle tragen die gleiche Tasche, alle gehören dazu.'],
    use: ['Sportverein & Team', 'Dienstreise', 'Fitnessstudio', 'Klassenfahrt', 'Incentive'],
    deco: ['Vereinswappen, Firmenlogo oder Spielername: Die Seiten- und Frontflächen lassen sich gut besticken oder bedrucken. Mit Namen versehen findet jeder sofort seine Tasche.'],
    ideal: 'Sportverein, Dienstreise, Fitness, Incentive' },
  shopper: { re: /shopper|einkaufs|jute|juco|baumwolltasche|tragetasche|stofftasche|zuziehbeutel|turnbeutel|beutel|canvas-tasche|matchsack|markttasche|geschenktasche|flaschentasche|netz|gymsac|bag for life|einkaufskorb/i,
    head: ['Nachhaltig werben – bei jedem Einkauf', 'Die Tasche, die immer wieder mitkommt', 'Ihr Logo geht einkaufen'],
    hook: ['Stoff- und Einkaufstaschen sind die Dauerläufer unter den Werbemitteln: {Dies} von {brand} wird beim Einkauf, im Alltag und auf Veranstaltungen immer wieder getragen.', 'Mit {diesem} von {brand} werben Sie nachhaltig und sympathisch – eine Tasche, die Plastiktüten ersetzt und Ihr Logo hundertfach durch die Stadt trägt.'],
    use: ['Messe & Giveaway', 'Einzelhandel & Hofladen', 'Tagungstasche', 'Stadtmarketing', 'Merchandise'],
    deco: ['Die große, flache Vorderseite ist ideal für Siebdruck oder Transferdruck – vom einfarbigen Logo bis zum großflächigen Motiv. Gerade bei Messen und Aktionen lohnen sich Staffelmengen.'],
    ideal: 'Messe, Giveaway, Einzelhandel, Merchandise' },
  tasche: { re: /tasche|etui|organizer|kulturbeutel|geldbörse|brieftasche|mappe|mäppchen|crossbag|sacoche|pouch|kartenetui|drybag|regenschutz|einlege|schultergurt|wäschesack|hüfttasche|gürteltasche/i,
    head: ['Kleine Tasche, große Wirkung', 'Ordnung mit Stil', 'Praktisch, handlich, gebrandet'],
    hook: ['{dies} von {brand} ist eines dieser Teile, die man jeden Tag in der Hand hat – und genau deshalb ein starker Träger für Ihre Marke.', 'Praktische Begleiter werden am häufigsten benutzt. {Dies} von {brand} sorgt für Ordnung und zeigt dabei dezent, von wem er stammt.'],
    use: ['Kundengeschenk', 'Mitarbeiter-Ausstattung', 'Messe & Tagung', 'Reise & Alltag'],
    deco: ['Ein dezentes Logo per Stick oder Transferdruck auf der Vorderseite wirkt hochwertig und unaufdringlich. Wir beraten gern, welche Fläche sich für Ihr Motiv eignet.'],
    ideal: 'Kundengeschenk, Tagung, Mitarbeiter, Reise' },
  cap: { re: /cap\b|-cap|snapback|visor|trucker|dad hat|jockey/i,
    head: ['Ihr Logo auf Augenhöhe', 'Die Cap, die man gern trägt', 'Kopfsache: Markenauftritt'],
    hook: ['Eine Cap trägt Ihr Logo genau dort, wo jeder hinschaut: auf Augenhöhe. {Dies} von {brand} ist bei Teams, Events und als Merchandise ein echter Klassiker.', '{dies} von {brand} ist mehr als Sonnenschutz – sie ist ein Statement. Ob Team-Look, Fan-Artikel oder Merch für die eigene Marke: Diese Cap wird gern getragen.'],
    use: ['Teamwear', 'Merchandise & Fanartikel', 'Events & Festivals', 'Promotion', 'Vereinsfeste'],
    deco: ['Für Caps ist der Stick auf der Front die erste Wahl: plastisch, edel und extrem langlebig. Zusätzlich sind Seiten- und Rückenmotive möglich, etwa eine Webadresse über dem Verschluss.'],
    ideal: 'Team, Merchandise, Festival, Promotion' },
  hut: { re: /hut\b|fischerhut|trilby|schiebermütze|bucket/i,
    head: ['Stil mit Schatten', 'Ein Hut mit Haltung', 'Sommerlook mit Logo'],
    hook: ['{dies} von {brand} bringt Lässigkeit in jeden Look – am Strand, auf dem Festival, beim Gartenfest oder auf dem Golfplatz.', 'Hüte sind zurück und ein ungewöhnliches Werbemittel, das auffällt: {Dies} von {brand} macht aus Ihrem Logo ein Mode-Statement.'],
    use: ['Festival & Sommerevent', 'Merchandise', 'Golf & Outdoor', 'Promotion-Team'],
    deco: ['Ein kleiner Stick vorne oder seitlich auf der Krempe wirkt besonders stilvoll. Für Merchandise sind auch Patches oder farbige Motive möglich.'],
    ideal: 'Festival, Merchandise, Sommer, Golf' },
  muetze: { re: /mütze|beanie|stirnband|sherpa/i,
    head: ['Warm eingepackt mit Logo', 'Der Wintertrend für Ihr Team', 'Kalte Tage, warme Köpfe'],
    hook: ['Wenn es draußen kalt wird, ist {dies} von {brand} das Teil, das jeder dabeihat – auf dem Weihnachtsmarkt, beim Wintertraining, auf der Baustelle oder im Stadion.', '{dies} von {brand} hält warm und sieht gut aus. Mit Ihrem Logo bestickt wird sie zum beliebten Wintergeschenk für Team und Kunden.'],
    use: ['Weihnachtsgeschenk', 'Wintersport & Training', 'Fanartikel', 'Outdoor-Teams', 'Merchandise'],
    deco: ['Auf Strickmützen ist ein Stick die beste Wahl – vorne mittig oder auf dem Umschlag. Für Fanartikel lassen sich auch Patches oder Webetiketten anbringen.'],
    ideal: 'Weihnachtsgeschenk, Fans, Wintersport, Team' },
  acc: { re: /schal|tuch|bandana|handschuh|handwärmer|socke|stulpe|krawatte|fliege|hosenträger|lätzchen|schlafmaske|halswärmer|sturmhaube|gürtel|schleife/i,
    head: ['Das Detail, das den Look vollendet', 'Kleine Teile, große Wirkung', 'Accessoire mit Absender'],
    hook: ['Accessoires machen den Unterschied: {Dies} von {brand} rundet Teamkleidung ab, eignet sich als Fanartikel oder als liebevolles Präsent.', '{dies} von {brand} ist ein kleines Extra, das gern benutzt wird – und damit eine charmante Fläche für Ihre Marke.'],
    use: ['Fanartikel', 'Kundengeschenk', 'Teamausstattung', 'Events'],
    deco: ['Je nach Material eignen sich Stick, Transferdruck oder ein eingewebtes Label. Wir beraten Sie gern, was für Ihr Motiv und Ihre Stückzahl am besten passt.'],
    ideal: 'Fanartikel, Geschenk, Team, Events' },
  baby: { re: /baby|body|strampler|overall|latzhose/i, textile: true,
    head: ['Klein, weich, zum Verlieben', 'Für die Kleinsten', 'Das erste Teamshirt'],
    hook: ['{dies} von {brand} ist für zarte Babyhaut gemacht – ein wunderbares Geschenk zur Geburt, für Kita und Familie oder als kleinste Größe im Vereinslook.'],
    use: ['Geschenk zur Geburt', 'Kita & Krippe', 'Vereinsnachwuchs', 'Familienfeier'],
    deco: ['Ein kleiner Stick oder ein weicher Druck mit Name, Geburtsdatum oder Vereinslogo macht daraus ein ganz persönliches Erinnerungsstück.'],
    ideal: 'Geburt, Taufe, Kita, Vereinsnachwuchs' },
  softshell: { re: /softshell/i, textile: true,
    head: ['Wetterfest. Bewegungsfreudig. Markant.', 'Die Jacke für jedes Wetter', 'Bereit für Wind und Wetter'],
    hook: ['{dies} von {brand} ist die Allround-Jacke für draußen: schützt vor Wind und Schauern, lässt dabei aber genug Bewegungsfreiheit für Arbeit, Training und Freizeit.', 'Wenn das Wetter wechselt, ist {dies} von {brand} genau richtig. Softshell ist leichter als eine Winterjacke, robuster als ein Pullover – und sieht mit Logo richtig professionell aus.'],
    use: ['Außendienst & Service', 'Trainer & Betreuer', 'Handwerk', 'Outdoor-Teams', 'Messe-Personal'],
    deco: ['Auf Softshell wird das Logo üblicherweise auf die linke Brust gestickt; auf dem Rücken ist Platz für Firmennamen oder Vereinsschriftzug. Viele Modelle haben einen Veredelungszugang, damit der Stick sauber sitzt.'],
    ideal: 'Außendienst, Trainer, Handwerk, Outdoor' },
  fleece: { re: /fleece|microfleece|polartherm/i, textile: true,
    head: ['Kuschelig warm im Teamlook', 'Wärme, die man spürt', 'Der gemütliche Allrounder'],
    hook: ['{dies} von {brand} ist das Lieblingsstück für kühle Tage: wärmend, leicht und angenehm weich – im Büro, auf dem Sportplatz oder beim Outdoor-Einsatz.'],
    use: ['Outdoor & Garten', 'Trainer & Betreuer', 'Lager & Logistik', 'Schule & Kita', 'Vereine'],
    deco: ['Fleece ist ideal zum Besticken: Ein Logo auf der Brust wirkt plastisch und hochwertig. Rückenschriftzüge sind ebenfalls möglich.'],
    ideal: 'Outdoor, Trainer, Lager, Verein' },
  weste: { re: /weste|bodywarmer|gilet|pullunder/i, textile: true,
    head: ['Warm im Kern, frei in der Bewegung', 'Die Weste für jede Jahreszeit', 'Mehr Freiheit, mehr Stil'],
    hook: ['{dies} von {brand} hält den Oberkörper warm und lässt die Arme frei – perfekt für Arbeit, Training und alle, die viel in Bewegung sind.'],
    use: ['Handwerk & Service', 'Trainer & Betreuer', 'Messe & Empfang', 'Outdoor & Garten'],
    deco: ['Brustlogo links und Schriftzug auf dem Rücken – so wird die Weste zur sichtbaren Teamkleidung. Gestickt wirkt sie besonders wertig.'],
    ideal: 'Handwerk, Trainer, Messe, Outdoor' },
  jacke: { re: /jacke|parka|blouson|windbreaker|windrunner|pilot|regenanzug|anorak/i, textile: true,
    head: ['Die Jacke, die Ihr Team zusammenhält', 'Draußen gut angezogen', 'Starker Auftritt bei jedem Wetter'],
    hook: ['{dies} von {brand} ist gemacht für draußen – für den Weg zur Arbeit, den Außeneinsatz, das Training oder den Stadionbesuch.', 'Eine gute Jacke trägt man jeden Tag. Mit Ihrem Logo wird {dies} von {brand} zum Aushängeschild, das überall mit hingeht.'],
    use: ['Außendienst & Service', 'Vereine & Trainer', 'Events & Crew', 'Handwerk', 'Merchandise'],
    deco: ['Auf Jacken kommt Ihr Logo meist auf die linke Brust – gestickt für einen hochwertigen Auftritt. Ein großer Rückendruck oder Rückenstick macht Teams schon von Weitem erkennbar.'],
    ideal: 'Außendienst, Verein, Event-Crew, Handwerk' },
  sweatjacke: { re: /sweatjacke|zip hoodie|kapuzensweatjacke|strickjacke|troyer/i, textile: true,
    head: ['Reißverschluss auf, Teamgeist an', 'Der Lagenlook für jeden Tag', 'Gemütlich mit Haltung'],
    hook: ['{dies} von {brand} ist das Teil, das man morgens anzieht und abends nicht mehr ausziehen will – im Büro, beim Training oder unterwegs.'],
    use: ['Teamwear & Verein', 'Büro & Agentur', 'Schule & Abschluss', 'Merchandise'],
    deco: ['Kleines Brustlogo vorne, großer Schriftzug auf dem Rücken: Sweatjacken sind wie gemacht für Teamkleidung. Gestickt oder gedruckt – beides sieht hervorragend aus.'],
    ideal: 'Team, Verein, Abschlussjahrgang, Merchandise' },
  hoodie: { re: /kapuzen|hoodie/i, textile: true,
    head: ['Der Hoodie, den alle wollen', 'Lieblingsstück mit Kapuze', 'Streetstyle trifft Teamgeist'],
    hook: ['Kaum ein Kleidungsstück wird so gern getragen wie ein guter Hoodie. {Dies} von {brand} ist bequem, lässig und genau das, was Teams, Vereine und Marken-Fans anziehen möchten.', '{dies} von {brand} ist das Lieblingsteil für Freizeit, Training und Büro – und mit Ihrem Logo das beliebteste Merchandise überhaupt.'],
    use: ['Merchandise & Fanartikel', 'Abschlussjahrgang', 'Teamwear & Verein', 'Start-up & Agentur', 'Crew-Shirt für Events'],
    deco: ['Großer Druck auf Brust oder Rücken, kleiner Stick am Herzen oder ein Schriftzug am Ärmel: Hoodies bieten viel Fläche für Kreativität. Für Abschlussjahrgänge sind Namen auf dem Rücken besonders beliebt.'],
    ideal: 'Merchandise, Abschluss, Verein, Crew' },
  sweat: { re: /sweatshirt|pullover|sweat\b|sweat id|nublend|troyer|crew/i, textile: true,
    head: ['Gemütlich, aber gut angezogen', 'Der Pullover für jeden Tag', 'Der Klassiker für Teamkleidung'],
    hook: ['{dies} von {brand} ist der unkomplizierte Begleiter für kühlere Tage – im Büro, beim Training, unterwegs oder auf dem Sofa.'],
    use: ['Teamwear', 'Büro & Agentur', 'Vereine', 'Merchandise', 'Schule'],
    deco: ['Brustlogo, großes Frontmotiv oder Schriftzug auf dem Rücken – Sweatshirts lassen sich hervorragend besticken und bedrucken.'],
    ideal: 'Team, Büro, Verein, Merchandise' },
  polo: { re: /polo/i, textile: true,
    head: ['Das Polo, das immer passt', 'Gepflegter Auftritt, entspannt getragen', 'Der Klassiker für Ihr Team'],
    hook: ['Ein Poloshirt ist der perfekte Mittelweg zwischen Hemd und T-Shirt: gepflegt genug für Kundenkontakt, bequem genug für den ganzen Tag. {Dies} von {brand} macht Ihr Team auf den ersten Blick erkennbar.', '{dies} von {brand} ist die erste Wahl, wenn Ihr Team ordentlich aussehen und sich trotzdem frei bewegen soll – am Empfang, im Service, auf der Messe oder im Verein.'],
    use: ['Empfang & Service', 'Messe & Events', 'Handwerk & Technik', 'Vereine & Golf', 'Gastronomie'],
    deco: ['Für Polos ist ein gesticktes Brustlogo der Klassiker – edel, plastisch und waschbeständig. Auf dem Rücken oder Ärmel ist zusätzlich Platz für Webadresse oder Abteilungsnamen.'],
    ideal: 'Empfang, Service, Messe, Verein' },
  hemd: { re: /hemd|bluse|overshirt|shirt mit/i, textile: true,
    head: ['Professionell vom Kragen bis zum Saum', 'Ein starker erster Eindruck', 'Business-Look mit Logo'],
    hook: ['{dies} von {brand} sorgt für den gepflegten Auftritt, den Kunden erwarten – am Empfang, im Verkauf, im Service oder im Meeting.', 'Mit {diesem} von {brand} wirkt Ihr Team professionell und einheitlich, ohne steif zu sein.'],
    use: ['Empfang & Verkauf', 'Hotel & Gastronomie', 'Bank & Büro', 'Messe-Personal', 'Events & Hochzeit'],
    deco: ['Auf Hemden und Blusen wirkt ein kleines, gesticktes Logo auf der Brust oder am Kragen besonders elegant – dezent, hochwertig und dauerhaft.'],
    ideal: 'Empfang, Verkauf, Hotel, Messe' },
  tshirt: { re: /t-shirt|shirt|tanktop|top\b|langarm|longsleeve|tee/i, textile: true,
    head: ['Das Shirt für Ihr Motiv', 'Basic mit großer Wirkung', 'Bereit für Ihr Logo'],
    hook: ['T-Shirts sind die Leinwand für Ihre Botschaft. {Dies} von {brand} ist die solide Basis für Teamshirts, Event-Crews, Vereinsfeste und Merchandise.', '{dies} von {brand} ist ein Shirt, das man gern trägt – und damit genau das richtige für Ihr Logo, Ihren Spruch oder Ihr Event-Motiv.'],
    use: ['Event-Crew & Festival', 'Vereine & Turniere', 'Junggesellenabschied', 'Promotion', 'Merchandise'],
    deco: ['Ob großes Frontmotiv, Brustlogo oder Rückennummer: T-Shirts lassen sich per Siebdruck, Transferdruck oder Stick in jeder Größenordnung veredeln. Für kleine Auflagen ab 1 Stück ist Transferdruck ideal.'],
    ideal: 'Event, Verein, Promotion, Merchandise' },
  hose: { re: /hose|shorts|bermuda|leggings|jogger|pants|trouser/i, textile: true,
    head: ['Bewegungsfreiheit mit Stil', 'Die Hose, die mitmacht', 'Bequem von Kopf bis Fuß im Teamlook'],
    hook: ['{dies} von {brand} macht jede Bewegung mit – beim Sport, bei der Arbeit oder in der Freizeit.'],
    use: ['Sport & Training', 'Teamwear', 'Freizeit', 'Arbeit & Service'],
    deco: ['An Hosen kommt das Logo meist auf das Bein, die Hüfte oder die Gesäßtasche – dezent per Stick oder Transferdruck.'],
    ideal: 'Sport, Team, Freizeit, Arbeit' },
  kleid: { re: /kleid|rock|jumpsuit/i, textile: true,
    head: ['Feminin, bequem, besonders', 'Stilvoll im Teamlook', 'Ein Kleid mit Persönlichkeit'],
    hook: ['{dies} von {brand} verbindet Komfort und Stil – für Service-Teams, Events, Merchandise oder den Alltag.'],
    use: ['Service & Empfang', 'Merchandise', 'Events', 'Mode-Label'],
    deco: ['Ein kleines Logo auf der Brust oder ein Druck im Nacken wirkt bei Kleidern besonders stilvoll.'],
    ideal: 'Service, Events, Merchandise' },
  arbeit: { re: /arbeits|work|kittel|sicherheitsschuh|regenponcho|poncho|regenhose|cargo|latzhose/i, textile: true,
    head: ['Gemacht für echte Arbeit', 'Robust im Einsatz, stark im Auftritt', 'Arbeitskleidung mit Profil'],
    hook: ['{dies} von {brand} ist für den harten Alltag gemacht – auf der Baustelle, in der Werkstatt, im Lager oder beim Außeneinsatz.', 'Arbeitskleidung muss einiges aushalten. {Dies} von {brand} ist robust, praktisch und mit Ihrem Firmenlogo gleichzeitig Ihre Visitenkarte vor Ort.'],
    use: ['Handwerk & Bau', 'Werkstatt & Lager', 'Hausmeister & Facility', 'Garten- & Landschaftsbau'],
    deco: ['Firmenlogo auf der Brust, Firmenname und Telefonnummer auf dem Rücken: So wird Arbeitskleidung zur fahrenden Werbefläche. Stick und Transferdruck sind beide besonders langlebig.'],
    ideal: 'Handwerk, Bau, Werkstatt, Facility' },
  unterwaesche: { re: /boxershorts|slip|crop-top|pyjama/i, textile: true,
    head: ['Komfort, der nah dran ist', 'Bequem bis ins Detail'],
    hook: ['{dies} von {brand} sorgt für Tragekomfort von morgens bis abends – beim Sport und im Alltag.'],
    use: ['Merchandise', 'Sport', 'Geschenk'],
    deco: ['Für Merchandise-Kollektionen lassen sich Logo-Drucke oder Labels anbringen – sprechen Sie uns an.'],
    ideal: 'Merchandise, Sport, Geschenk' },
  werbe: { re: /./,
    head: ['Ein Werbeartikel mit Nutzen', 'Praktisch und gern behalten', 'Werbung, die ankommt'],
    hook: ['{dies} von {brand} ist ein praktischer Begleiter, der gern benutzt wird – und damit eine sympathische Fläche für Ihre Marke.'],
    use: ['Kundengeschenk', 'Messe & Events', 'Mitarbeiter', 'Promotion'],
    deco: ['Wir prüfen gern, welche Veredelung für diesen Artikel und Ihr Motiv am besten geeignet ist, und senden Ihnen vor der Produktion eine Vorschau.'],
    ideal: 'Kundengeschenk, Messe, Promotion' },
};
const NOUN: Record<string, [string, string]> = {warn: ['Dieser Warnschutz-Artikel', 'diesem Warnschutz-Artikel'], schuerze: ['Diese Schürze', 'dieser Schürze'], koch: ['Diese Berufskleidung', 'dieser Berufskleidung'], schirm: ['Dieser Schirm', 'diesem Schirm'], ente: ['Diese Ente', 'dieser Ente'], pluesch: ['Diese Plüschfigur', 'dieser Plüschfigur'], handtuch: ['Dieser Frottee-Artikel', 'diesem Frottee-Artikel'], decke: ['Dieses Kuschelstück', 'diesem Kuschelstück'], kuehl: ['Diese Kühltasche', 'dieser Kühltasche'], rucksack: ['Dieser Rucksack', 'diesem Rucksack'], reise: ['Diese Tasche', 'dieser Tasche'], shopper: ['Diese Tasche', 'dieser Tasche'], tasche: ['Dieses praktische Teil', 'diesem praktischen Teil'], cap: ['Diese Cap', 'dieser Cap'], hut: ['Dieser Hut', 'diesem Hut'], muetze: ['Diese Mütze', 'dieser Mütze'], acc: ['Dieses Accessoire', 'diesem Accessoire'], baby: ['Dieses Babyteil', 'diesem Babyteil'], softshell: ['Diese Softshelljacke', 'dieser Softshelljacke'], fleece: ['Dieses Fleece-Teil', 'diesem Fleece-Teil'], weste: ['Diese Weste', 'dieser Weste'], jacke: ['Diese Jacke', 'dieser Jacke'], sweatjacke: ['Diese Jacke', 'dieser Jacke'], hoodie: ['Dieser Hoodie', 'diesem Hoodie'], sweat: ['Dieser Pullover', 'diesem Pullover'], polo: ['Dieses Poloshirt', 'diesem Poloshirt'], hemd: ['Dieses Modell', 'diesem Modell'], tshirt: ['Dieses Shirt', 'diesem Shirt'], hose: ['Diese Hose', 'dieser Hose'], kleid: ['Dieses Modell', 'diesem Modell'], arbeit: ['Diese Arbeitskleidung', 'dieser Arbeitskleidung'], unterwaesche: ['Dieses Wäscheteil', 'diesem Wäscheteil'], werbe: ['Dieser Artikel', 'diesem Artikel']};
const ORDER = ['warn', 'schuerze', 'koch', 'schirm', 'ente', 'pluesch', 'handtuch', 'decke', 'kuehl', 'rucksack', 'reise', 'shopper', 'baby', 'cap', 'hut', 'muetze', 'acc', 'softshell', 'fleece', 'weste', 'sweatjacke', 'hoodie', 'polo', 'hemd', 'arbeit', 'jacke', 'sweat', 'unterwaesche', 'kleid', 'hose', 'tshirt', 'tasche', 'werbe'];
const CAT_KIND: Record<string, string> = { 'taschen-rucksaecke': 'tasche', schirme: 'schirm', handtuecher: 'handtuch', decken: 'decke', 'pluesch-spielzeug': 'pluesch', warnschutz: 'warn', 'gastro-kueche': 'koch', 'caps-muetzen': 'cap', accessoires: 'acc', 'poloshirts': 'polo', 't-shirts': 'tshirt', sweatshirts: 'sweat', jacken: 'jacke', hosen: 'hose', 'hemden-blusen': 'hemd', kleider: 'kleid', arbeitskleidung: 'arbeit', unterwaesche: 'unterwaesche' };

export function kindOf(p: P): string {
  const n = p.name.replace(/\([^)]*\)\s*$/, '');
  for (const k of ORDER) if (k !== 'werbe' && K[k].re.test(n)) return k;
  const cs = (p.category ?? '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-');
  return CAT_KIND[cs] ?? 'werbe';
}

function materialText(p: P, kind: string, seed: string): string {
  const comp = clean(p.composition);
  const gsm = Number(clean(p.material).match(/(\d+)\s*g\/m²/)?.[1] ?? 0);
  const t = K[kind].textile;
  const cotton = /baumwolle/i.test(comp), poly = /polyester/i.test(comp), ela = /elast|spandex/i.test(comp), wool = /(^|[^m])wolle|merino/i.test(comp.replace(/baumwolle/gi, '')), jute = /jute/i.test(comp), recy = /recyc/i.test(comp + ' ' + (p.specs?.['Zertifizierung'] ?? '') + ' ' + (p.features ?? []).join(' '));
  const pure = /baumwolle\s*\((100|bis 100)%\)/i.test(comp);
  const s: string[] = [];
  if (pure && cotton) s.push(pick(['Reine Baumwolle sorgt für ein natürliches, atmungsaktives Tragegefühl – angenehm auf der Haut, auch an langen Tagen.', 'Aus 100 % Baumwolle: weich, atmungsaktiv und genau das Material, auf dem Druck und Stick besonders gut aussehen.'], seed));
  else if (cotton && poly) s.push('Die Mischung aus Baumwolle und Polyester vereint das Beste aus zwei Welten: weich wie Baumwolle, dabei formstabil, farbecht und pflegeleicht.');
  else if (poly && t && ['tshirt', 'polo', 'hose'].includes(kind)) s.push('Das Polyester-Material ist leicht, trocknet schnell und behält auch nach vielen Wäschen Form und Farbe – ideal, wenn es sportlich zugeht.');
  else if (poly && ['jacke', 'softshell', 'fleece', 'weste', 'warn'].includes(kind)) s.push('Das robuste Polyester-Material ist strapazierfähig, pflegeleicht und für den Einsatz draußen gemacht.');
  else if (jute) s.push('Jute ist ein Naturmaterial mit unverwechselbarer Optik – jede Tasche ist ein kleines Unikat mit natürlichem Charme.');
  else if (wool) s.push('Der Wollanteil sorgt für eine angenehme Wärme und eine hochwertige, natürliche Optik.');
  else if (cotton) s.push('Baumwolle sorgt für ein natürliches, angenehmes Tragegefühl und eine schöne Oberfläche für Ihr Logo.');
  else if (poly) s.push('Polyester macht den Artikel robust, formstabil und pflegeleicht.');
  else if (comp) s.push(`Material: ${comp.replace(/\s*\((anteilig|bis 100%)\)/g, '').replace(/\((\d+)%\)/g, '$1 %')}.`);
  if (ela && t) s.push('Ein Anteil Elasthan gibt dem Stoff Elastizität und Bewegungsfreiheit.');
  if (gsm && t) s.push(gsm < 150 ? `Mit ${gsm} g/m² ist der Stoff leicht und luftig – angenehm an warmen Tagen.` : gsm < 190 ? `Mit ${gsm} g/m² liegt der Stoff angenehm mittelschwer in der Hand: robust genug für den Alltag, leicht genug für den ganzen Tag.` : gsm < 240 ? `Mit ${gsm} g/m² ist die Qualität kräftig und formstabil – das spürt man beim ersten Anziehen.` : `Mit ${gsm} g/m² gehört der Stoff zur schweren, besonders wertigen Qualität – fällt schön, wirkt hochwertig und hält lange.`);
  else if (gsm && kind === 'handtuch') s.push(gsm >= 450 ? `Mit ${gsm} g/m² ist das Frottee besonders dicht, flauschig und saugstark.` : `Mit ${gsm} g/m² ist das Material angenehm leicht und trocknet schnell.`);
  else if (gsm) s.push(`Das Material bringt ${gsm} g/m² auf die Waage.`);
  if (recy) s.push('Ein Plus für die Umwelt: Der Artikel wird anteilig aus recyceltem Material hergestellt.');
  const cert = clean(p.specs?.['Zertifizierung']);
  if (cert && cert !== 'Keine Angabe' && !/recyc/i.test(cert)) s.push(`Zertifizierung: ${cert}.`);
  return s.join(' ');
}

function detailText(f: string[], seed: string): string {
  if (!f.length) return '';
  const a = f.filter((x) => x.length <= 75 && !/nicht|recycel/i.test(x) && (x.match(/,/g) ?? []).length < 2).slice(0, 4).map((x) => lc(x.replace(/\.$/, '')));
  if (!a.length) return '';
  return `${pick(['Durchdacht bis ins Detail', 'Die Ausstattung im Überblick', 'Das macht den Unterschied'], seed)}: ${list(a)}.`;
}

function rangeText(p: P, kind: string, seed: string): string {
  const n = p.colors.length;
  const sizes = p.sizes.filter((s) => s && s !== 'One Size');
  const isSize = sizes.length > 1 && sizes.every((s) => s.length <= 6);
  const parts: string[] = [];
  if (n >= 15) parts.push(pick([`Mit ${n} Farben findet sich für jede Corporate Identity und jedes Vereinswappen der passende Ton.`, `${n} Farben lassen Ihnen alle Freiheit – vom dezenten Klassiker bis zur Signalfarbe Ihres Teams.`], seed));
  else if (n >= 4) parts.push(`Erhältlich in ${n} Farben, darunter ${list(p.colors.slice(0, 3).map((c) => c.name))}.`);
  else if (n > 1) parts.push(`Erhältlich in ${list(p.colors.map((c) => c.name))}.`);
  else if (n === 1 && !/standard|multi|assorted|sortiert/i.test(p.colors[0].name)) parts.push(`Farbe: ${p.colors[0].name}.`);
  if (isSize) parts.push(`Die Größen reichen von ${sizes[0]} bis ${sizes[sizes.length - 1]}${/xl$/i.test(sizes[sizes.length - 1]) && /^[3-8]xl$/i.test(sizes[sizes.length - 1]) ? ' – so ist das ganze Team abgedeckt' : ''}.`);
  else if (p.specs?.['Maße']) parts.push(`Maße: ${p.specs['Maße']}.`);
  else if (p.sizes[0] === 'One Size' && K[kind].textile) parts.push('Eine Größe für alle.');
  const g = p.gender;
  if (K[kind].textile && g === 'Damen' && kind !== 'kleid') parts.push('Der feminine Schnitt sitzt figurnah und bequem.');
  if (K[kind].textile && g === 'Kinder') parts.push('In Kindergrößen – ideal, damit der Nachwuchs im gleichen Look wie die Großen auftritt.');
  return parts.join(' ');
}

const bkey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const BRAND_IDX = new Map(Object.entries(BRAND_TEXTS).map(([k, v]) => [bkey(k), v.t]));
/** Ein bis zwei Sätze zur Marke aus den Markenporträts */
function brandLine(brand: string): string {
  const k = bkey(brand);
  const t = BRAND_IDX.get(k) ?? [...BRAND_IDX.entries()].filter(([x]) => k.startsWith(x) && x.length >= 4).sort((a, b) => b[0].length - a[0].length)[0]?.[1];
  if (!t) return '';
  const para = t.split('\n\n')[0];
  const sents = para.match(/[^.!?]+[.!?]+/g) ?? [para];
  const out = sents.slice(0, 2).map((x) => x.trim()).join(' ');
  return out.length > 320 ? sents[0].trim() : out;
}
const TIP: Record<string, string> = {
  textil: 'Tipp: Kombinieren Sie den Artikel mit passenden Teilen aus unserem Sortiment im gleichen Logo – so entsteht ein kompletter Teamlook, und über die Gesamtmenge werden Veredelung und Staffelpreise günstiger.',
  cap: 'Tipp: Caps und Mützen im gleichen Design wie Shirts oder Hoodies runden Ihren Auftritt ab – ideal als Set für Team, Fans oder Merchandise.',
  tasche: 'Tipp: Gefüllt mit kleinen Extras wird die Tasche zum perfekten Willkommenspaket für neue Mitarbeitende oder zum Messe-Highlight.',
  geschenk: 'Tipp: Als Teil eines Geschenksets – zusammen mit einer Decke, Tasse oder Tasche – wird daraus ein Präsent, das lange in Erinnerung bleibt.',
  arbeit: 'Tipp: Statten Sie Ihr Team von Kopf bis Fuß einheitlich aus – Jacke, Shirt, Hose und Cap mit gleichem Logo wirken professionell und schaffen Vertrauen beim Kunden.',
};
const TIP_OF: Record<string, string> = { cap: 'cap', hut: 'cap', muetze: 'cap', rucksack: 'tasche', reise: 'tasche', shopper: 'tasche', tasche: 'tasche', kuehl: 'tasche', schirm: 'geschenk', ente: 'geschenk', pluesch: 'geschenk', handtuch: 'geschenk', decke: 'geschenk', acc: 'geschenk', werbe: 'geschenk', warn: 'arbeit', arbeit: 'arbeit', koch: 'arbeit', schuerze: 'arbeit' };

export function buildCopy(p: P): Copy {
  const kind = kindOf(p);
  const k = K[kind];
  const seed = p.id || p.sku;
  const kurz = p.name.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+(Herren|Damen|Kinder|Unisex)$/, '');
  const [Dies, diesem] = NOUN[kind] ?? NOUN.werbe;
  const v = { kurz, brand: p.brand || 'unserem Partner', name: p.name, Dies, dies: Dies[0].toLowerCase() + Dies.slice(1), diesem };
  const feats = (p.features ?? []).map(clean).filter((x) => x && x.length <= 110 && !NOISE.test(x));
  const hook0 = fill(pick(k.hook, seed + 'h'), v);
  const hook = hook0[0].toUpperCase() + hook0.slice(1);
  const mat = materialText(p, kind, seed);
  const det = detailText(feats.filter((x) => !/^(baumwolle|polyester)/i.test(x)), seed + 'd');
  const rng = rangeText(p, kind, seed + 'r');
  const uses = k.use;
  const forWho = p.gender === 'Kinder' ? 'für Kinder- und Jugendteams, Schulen und Kitas' : p.gender === 'Damen' ? 'für Damenteams und alle, die einen taillierten Schnitt mögen' : '';
  const useP = `${pick(['Typische Einsatzbereiche', 'Perfekt geeignet für', 'Hier macht der Artikel eine besonders gute Figur'], seed + 'u')}: ${list(uses.slice(0, 4))}${forWho ? ` – ${forWho}` : ''}.`;
  const sub = /sublimation|subli/i.test(p.name + ' ' + feats.join(' ')) ? ' Dieser Artikel ist für Sublimationsdruck ausgelegt – damit sind vollflächige, fotorealistische Motive möglich.' : '';
  const deco = `${pick(k.deco, seed + 'v')}${sub} Schon ab 1 Stück, ab 10 Stück zu Staffelpreisen – und vor jeder Produktion bekommen Sie eine Vorschau zur Freigabe.`;
  const bl = brandLine(p.brand);
  const tip = TIP[TIP_OF[kind] ?? 'textil'];
  const intro = [[hook, bl].filter(Boolean).join(' '), [mat, det].filter(Boolean).join(' '), [rng, useP].filter(Boolean).join(' '), deco, tip].filter(Boolean).join('\n\n');
  const gsm = clean(p.material).match(/(\d+)\s*g\/m²/)?.[1];
  const highlights = [
    [gsm && `${gsm} g/m²`, clean(p.composition).replace(/\s*\((anteilig|bis 100%)\)/g, '').replace(/\((\d+)%\)/g, '$1 %')].filter(Boolean).join(' · '),
    ...feats.slice(0, 4),
    p.colors.length > 1 ? `${p.colors.length} Farben${p.sizes.length > 1 ? `, Größen ${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}` : ''}` : '',
    clean(p.specs?.['Zertifizierung']) && p.specs!['Zertifizierung'] !== 'Keine Angabe' ? p.specs!['Zertifizierung'] : '',
  ].filter(Boolean).slice(0, 6);
  return { headline: pick(k.head, seed + 'k'), intro, highlights, idealFor: k.ideal };
}
