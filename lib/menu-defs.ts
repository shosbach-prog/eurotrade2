/** Unterkategorien (Artikeltyp) je Kategorie – Erkennung über den Artikelnamen */
export type SubDef = { key: string; label: string; title?: string; re: RegExp; not?: RegExp; /** frühere Adressen (werden umgeleitet) */ alias?: string[] };

export const SUBTYPES: Record<string, SubDef[]> = {
  't-shirts': [
    { key: 't-shirts-kurzarm', label: 'T-Shirts kurzarm', re: /t-?shirt/i, not: /long|langarm|tank|crop|oversize|boxy|heavy/i },
    { key: 'langarmshirts', label: 'Langarm & Long-Shirts', re: /long|langarm/i },
    { key: 'tanktops', label: 'Tanktops & Tops', re: /tank|\btop\b|neckholder/i },
    { key: 'cropped-shirts', label: 'Cropped Shirts', re: /crop/i },
    { key: 'oversize-t-shirts', label: 'Oversize & Heavy', title: 'Oversize & Heavy T-Shirts', re: /oversize|boxy|heavy/i },
  ],
  poloshirts: [
    { key: 'klassische-poloshirts', label: 'Klassische Polos', title: 'Klassische Poloshirts', re: /polo/i, not: /oversize|boxy|heavy/i },
    { key: 'oversize-poloshirts', label: 'Oversize & Heavy', title: 'Oversize & Heavy Poloshirts', re: /oversize|boxy|heavy/i },
  ],
  sweatshirts: [
    { key: 'kapuzenpullover', label: 'Kapuzenpullover', re: /kapuzen(pullover|-?sweatshirt)|hoodie/i, not: /jacke/i },
    { key: 'sweatjacken', label: 'Sweatjacken', re: /sweatjacke|zip-?jacke|parka/i },
    { key: 'sweatshirts-rundhals', label: 'Sweatshirts Rundhals', re: /sweatshirt|rundhals|college/i, not: /kapuze/i },
    { key: 'oversize-sweatshirts', label: 'Oversize & Cropped', title: 'Oversize & Cropped Sweatshirts', re: /oversize|cropped|heavy/i },
  ],
  jacken: [
    { key: 'fleecejacken', label: 'Fleecejacken', re: /fleece/i, not: /weste/i },
    { key: 'westen', label: 'Westen & Bodywarmer', re: /weste|bodywarmer/i },
    { key: 'steppjacken', label: 'Stepp- & Winterjacken', re: /stepp|padded|winter|parka/i, not: /weste|sweat/i },
    { key: 'windbreaker', label: 'Windbreaker & Regenjacken', re: /windbreaker|regen|schlupf|coach|softshell/i },
    { key: 'collegejacken', label: 'College- & Bomberjacken', re: /college|bomber|pilot/i },
  ],
  hosen: [
    { key: 'jogginghosen', label: 'Jogging- & Sweathosen', re: /jogging|sweathose|trainingshose/i },
    { key: 'shorts', label: 'Shorts', title: 'Shorts & Radlerhosen', re: /shorts|radler/i },
    { key: 'leggings', label: 'Leggings', re: /leggings/i },
    { key: 'arbeitshosen', label: 'Arbeits- & Stoffhosen', re: /workwear|cargohose|arbeits|anzughose|chino/i },
  ],
  accessoires: [
    { key: 'socken', label: 'Socken & Stulpen', re: /socke|stulpe/i },
    { key: 'schals', label: 'Schals & Tücher', re: /schal|tuch|sturmhaube|halswärmer/i },
    { key: 'handschuhe', label: 'Handschuhe', re: /handschuh/i },
    { key: 'krawatten', label: 'Krawatten & Fliegen', re: /krawatte|fliege|hosenträger/i },
    { key: 'taschen', label: 'Taschen', re: /tasche|beutel|rucksack/i },
  ],
  'caps-muetzen': [
    { key: 'caps', label: 'Caps', re: /cap\b|caps|kappe|snapback|visor|dad hat/i },
    { key: 'muetzen', label: 'Mützen & Beanies', re: /mütze|beanie|stirnband/i },
    { key: 'huete', label: 'Hüte & Fischerhüte', re: /hut\b|fischerhut|sonnenhut|strohhut|cowboyhut/i },
  ],
  'taschen-rucksaecke': [
    { key: 'rucksaecke', label: 'Rucksäcke', re: /rucksack/i, not: /überzug|kühl/i },
    { key: 'einkaufstaschen', label: 'Einkaufs- & Stofftaschen', re: /shopper|einkaufstasche|jute|baumwolltasche|tragetasche|canvas-tasche|canvas-trage|stofftasche|zuziehbeutel|turnbeutel|geschenktasche|netz-einkauf|matchsack|denim-tasche|tasche premier|flaschentasche|große tasche/i },
    { key: 'reisetaschen', label: 'Reise- & Sporttaschen', re: /reisetasche|sporttasche|trolley|teamtasche|multisport|handgepäck|kleidersack|seesack|duffle/i },
    { key: 'laptoptaschen', label: 'Laptop- & Dokumententaschen', re: /laptop|tablet|notebook|dokumententasche|büchertasche/i, not: /rucksack/i },
    { key: 'kuehltaschen', label: 'Kühltaschen', re: /kühl/i },
    { key: 'kleintaschen', label: 'Hüft-, Kultur- & Kleintaschen', re: /hüfttasche|gürteltasche|kulturbeutel|kulturtasche|kosmetik|organizer|reißverschlusstasche|geldbörse|brieftasche|handytasche|crossbag|crossbody|umhängetasche|aufbewahrung|einleg|rahmentasche/i },
  ],
  'gastro-kueche': [
    { key: 'schuerzen', label: 'Schürzen', re: /schürze|vorbinder/i },
    { key: 'kochjacken', label: 'Koch- & Servicekleidung', re: /kochjacke|kochhose|prep-hemd/i },
  ],
  warnschutz: [
    { key: 'warnwesten', label: 'Warnwesten', re: /warnweste/i },
    { key: 'warnschutzkleidung', label: 'Warnschutzkleidung', re: /warnschutz-(poloshirt|t-shirt|sweatshirt|kapuzen|regen|hybrid|thermo)|warnschutzjacke|warnschutz-thermo|zweifarbige warnschutz/i },
  ],
  'pluesch-spielzeug': [
    { key: 'quietscheenten', label: 'Quietsche-Enten', re: /ente/i },
    { key: 'plueschtiere', label: 'Plüsch- & Knautschtiere', re: /plüsch|minifeet|schmoozies|squeezies|teddy|pinguin|elch|elefant/i, not: /ente/i },
  ],
  schirme: [
    { key: 'stockschirme', label: 'Stock- & Gästeschirme', re: /stockschirm|gästeschirm|portierschirm|golf/i },
    { key: 'taschenschirme', label: 'Taschenschirme', re: /taschenschirm/i },
  ],
};

/** Adresse = sichtbarer Name: „Oversize & Cropped Sweatshirts“ → oversize-cropped-sweatshirts (alte Kurz-Slugs bleiben als Umleitung) */
const slugOf = (s: string) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
for (const list of Object.values(SUBTYPES)) for (const s of list) {
  const k = slugOf(s.title ?? s.label);
  if (k !== s.key) { s.alias = [...(s.alias ?? []), s.key]; s.key = k; }
}
export const subOf = (cat: string, key?: string | null) => (key ? SUBTYPES[cat]?.find((s) => s.key === key || s.alias?.includes(key)) ?? null : null);
/** Unterkategorie über ihren eigenen Slug (/kategorie/sweatjacken) */
export const subBySlug = (slug: string) => { for (const [cat, list] of Object.entries(SUBTYPES)) { const s = list.find((x) => x.key === slug || x.alias?.includes(slug)); if (s) return { cat, sub: s, old: s.key !== slug }; } return null; };
export const matchSub = (s: SubDef, name: string) => s.re.test(name) && !(s.not && s.not.test(name));

/** Hauptgruppen der Navigation; nicht zugeordnete Kategorien landen in der letzten Gruppe */
export const GROUPS: { key: string; label: string; cats: string[] }[] = [
  { key: 'shirts', label: 'Shirts & Polos', cats: ['t-shirts', 'poloshirts', 'hemden-blusen'] },
  { key: 'sweats', label: 'Pullover', cats: ['sweatshirts'] },
  { key: 'jacken', label: 'Jacken', cats: ['jacken'] },
  { key: 'hosen', label: 'Hosen & Kleider', cats: ['hosen', 'kleider', 'unterwaesche'] },
  { key: 'arbeit', label: 'Arbeit & Gastro', cats: ['arbeitskleidung', 'warnschutz', 'gastro-kueche'] },
  { key: 'acc', label: 'Caps & Zubehör', cats: ['caps-muetzen', 'accessoires'] },
  { key: 'taschen', label: 'Taschen & Werbemittel', cats: ['taschen-rucksaecke', 'schirme', 'handtuecher', 'decken', 'pluesch-spielzeug', 'werbeartikel'] },
];
export const GENDERS = ['Damen', 'Herren', 'Kinder'] as const;

export type MenuCat = { slug: string; name: string; count: number; subs: { key: string; label: string; count: number }[]; g: Record<string, number> };
export type Menu = {
  groups: { key: string; label: string; cats: MenuCat[] }[];
  genders: { label: string; cats: { slug: string; name: string; count: number }[]; total: number }[];
  brands: { slug: string; name: string; count: number }[];
  branchen: { href: string; label: string }[];
  /** im Admin markierte Sonderangebote */
  sale: number;
  /** Auslaufartikel laut L-Shop-Liste */
  eol: number;
};
