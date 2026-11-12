/** Unterkategorien (Artikeltyp) je Kategorie – Erkennung über den Artikelnamen */
export type SubDef = { key: string; label: string; title?: string; re: RegExp; not?: RegExp };

export const SUBTYPES: Record<string, SubDef[]> = {
  't-shirts': [
    { key: 't-shirts-kurzarm', label: 'T-Shirts kurzarm', re: /t-?shirt/i, not: /long|langarm|tank|crop|oversize|boxy|heavy/i },
    { key: 'langarmshirts', label: 'Langarm & Long-Shirts', re: /long|langarm/i },
    { key: 'tanktops', label: 'Tanktops & Tops', re: /tank|\btop\b|neckholder/i },
    { key: 'cropped-shirts', label: 'Cropped Shirts', re: /crop/i },
    { key: 'oversize-t-shirts', label: 'Oversize & Heavy', title: 'Oversize & Heavy T-Shirts', re: /oversize|boxy|heavy/i },
  ],
  poloshirts: [
    { key: 'klassische-poloshirts', label: 'Klassische Polos', re: /polo/i, not: /oversize|boxy|heavy/i },
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
    { key: 'socken', label: 'Socken', re: /socke/i },
    { key: 'schals', label: 'Schals & Tücher', re: /schal|tuch/i },
    { key: 'taschen', label: 'Taschen', re: /tasche|beutel|rucksack/i },
  ],
  'caps-muetzen': [
    { key: 'muetzen', label: 'Mützen & Beanies', re: /mütze|beanie/i },
    { key: 'caps', label: 'Caps', re: /cap\b|caps|kappe/i },
  ],
};

export const subOf = (cat: string, key?: string | null) => (key ? SUBTYPES[cat]?.find((s) => s.key === key) ?? null : null);
/** Unterkategorie über ihren eigenen Slug (/kategorie/sweatjacken) */
export const subBySlug = (slug: string) => { for (const [cat, list] of Object.entries(SUBTYPES)) { const s = list.find((x) => x.key === slug); if (s) return { cat, sub: s }; } return null; };
export const matchSub = (s: SubDef, name: string) => s.re.test(name) && !(s.not && s.not.test(name));

/** Hauptgruppen der Navigation; nicht zugeordnete Kategorien landen in der letzten Gruppe */
export const GROUPS: { key: string; label: string; cats: string[] }[] = [
  { key: 'shirts', label: 'Shirts & Polos', cats: ['t-shirts', 'poloshirts', 'hemden-blusen'] },
  { key: 'sweats', label: 'Pullover & Sweats', cats: ['sweatshirts'] },
  { key: 'jacken', label: 'Jacken & Westen', cats: ['jacken'] },
  { key: 'hosen', label: 'Hosen & Kleider', cats: ['hosen', 'kleider', 'unterwaesche', 'arbeitskleidung'] },
  { key: 'acc', label: 'Mützen & Accessoires', cats: ['caps-muetzen', 'accessoires', 'decken'] },
];
export const GENDERS = ['Damen', 'Herren', 'Kinder'] as const;

export type MenuCat = { slug: string; name: string; count: number; subs: { key: string; label: string; count: number }[]; g: Record<string, number> };
export type Menu = {
  groups: { key: string; label: string; cats: MenuCat[] }[];
  genders: { label: string; cats: { slug: string; name: string; count: number }[]; total: number }[];
  brands: { slug: string; name: string; count: number }[];
  branchen: { href: string; label: string }[];
  deals: number;
};
