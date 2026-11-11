import type { Product } from './types';

/** Piktogramme (L-Shop Marketing-Paket, public/picto) aus Artikeltexten ableiten */
export type Picto = { src: string; label: string };

const FEAT: [RegExp, string, string][] = [
  [/wasserdicht|waterproof/i, 'f-wasserdicht', 'Wasserdicht'],
  [/wasserabweisend|water.?repellent|wasserabstoßend/i, 'f-wasserabweisend', 'Wasserabweisend'],
  [/winddicht|windabweisend|windproof/i, 'f-winddicht', 'Winddicht'],
  [/atmungsaktiv|breathable/i, 'f-atmungsaktiv', 'Atmungsaktiv'],
  [/schnelltrocknend|quick.?dry|trocknet schnell/i, 'f-schnelltrocknend', 'Schnelltrocknend'],
  [/feuchtigkeits?(transport|regul|ableit)|flüssigkeitstransport|moisture|wicking/i, 'f-fluessigkeitstransportierend', 'Feuchtigkeitsregulierend'],
  [/anti.?pilling/i, 'f-anti-pilling', 'Anti-Pilling'],
  [/antibakteriell|antimikrobiell/i, 'f-antibakteriell', 'Antibakteriell'],
  [/abnehmbare?n? kapuze|abtrennbare kapuze/i, 'f-abnehmbare-kapuze', 'Abnehmbare Kapuze'],
  [/\b3.?in.?1\b/i, 'f-3in1', '3-in-1'],
  [/wendbar|wendejacke|reversible/i, 'f-reversible', 'Wendbar'],
  [/sublimation/i, 'f-sublimierbarer-artikel', 'Sublimierbar'],
  [/abreißbar|abreiß-?etikett|tear.?away|entfernbares?.{0,20}etikett/i, 'f-tear-away', 'Etikett abreißbar'],
  [/ohne (marken)?etikett|no.?label|etikettenfrei|labelfrei/i, 'f-no-label', 'Ohne Etikett'],
  [/en iso 20471|warnschutz|hi.?vis|high.?vis/i, 'f-high-vis', 'Warnschutz'],
  [/reflektier|reflektor|reflective/i, 'f-reflektorelemente', 'Reflektoren'],
  [/verschweißte nähte|getapte nähte|taped seams/i, 'f-verschweisste-naehte', 'Verschweißte Nähte'],
  [/veredelungs?(zugang|reißverschluss|öffnung)/i, 'f-veredlungszugang', 'Veredelungszugang'],
  [/kopfhörer/i, 'f-kopfhoererzugang', 'Kopfhörerausgang'],
  [/bügelfrei|non.?iron/i, 'f-buegelfrei', 'Bügelfrei'],
  [/bügelleicht|easy.?iron/i, 'f-buegelleicht', 'Bügelleicht'],
  [/easy.?care|pflegeleicht/i, 'f-easy-care', 'Pflegeleicht'],
  [/knitterarm|knitterfrei|knitterfest/i, 'f-knitterarm', 'Knitterarm'],
  [/industriewäsche|industrial wash|iso 15797/i, 'f-industriewaeschetauglich', 'Industriewäsche'],
  [/\b(upf|uv)\s*50/i, 'f-uv50', 'UV-Schutz 50+'],
  [/\b(upf|uv)\s*40/i, 'f-uv40', 'UV-Schutz 40+'],
  [/\b(upf|uv)\s*30/i, 'f-uv30', 'UV-Schutz 30+'],
  [/fairtrade/i, 'f-fairtrade', 'Fairtrade'],
  [/bio.?baumwolle|organic|\bgots\b|ökologisch angebaut/i, 'f-organic', 'Bio-Baumwolle'],
  [/recycel|recycled/i, 'f-anteilig-aus-recycelten-materialien', 'Recyceltes Material'],
  [/made in germany|hergestellt in deutschland|herkunft: deutschland/i, 'f-made-in-germany', 'Made in Germany'],
  [/made in italy|herkunft: italien/i, 'f-made-in-italy', 'Made in Italy'],
  [/made in (the )?eu\b|herkunft: (eu|europa|portugal|polen|türkei)/i, 'f-made-in-eu', 'Made in EU'],
  [/slim.?fit|tailliert|körperbetont/i, 'f-slim-fit', 'Slim Fit'],
  [/comfort.?fit|relaxed.?fit/i, 'f-comfort-fit', 'Comfort Fit'],
  [/regular.?fit|classic.?fit/i, 'f-regular-fit', 'Regular Fit'],
];
const WASH = [10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 95];
const WASH_S = [10, 20, 30, 40, 50, 60, 70, 80, 90];
const near = (list: number[], n: number) => list.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));

function careFrom(t: string): Picto[] {
  const out: Picto[] = [];
  const s = t.toLowerCase();
  const temp = s.match(/(\d{2})\s*°\s*c?\s*(waschbar|wäsche|maschinenwäsche)|waschbar bis (\d{2})|(schonwaschgang|feinwäsche|normalwaschgang|maschinenwäsche|waschen)\s*(bei\s*)?(\d{2})\s*°/);
  const n = temp ? Number(temp[1] ?? temp[3] ?? temp[6]) : null;
  if (/nicht waschen|nicht waschbar/.test(s)) out.push({ src: 'care-waschen-nichtwaschen', label: 'Nicht waschen' });
  else if (/handwäsche/.test(s)) out.push({ src: 'care-waschen-handwaesche-40', label: 'Handwäsche' });
  else if (n) {
    const soft = /schonwaschgang|feinwäsche|schonend/.test(s);
    const v = near(soft ? WASH_S : WASH, n);
    out.push({ src: `care-waschen-${soft ? 'schonwaschgang' : 'normalwaschgang'}-${v}`, label: `${soft ? 'Schonwaschgang' : 'Waschen'} ${v} °C` });
  }
  if (/nicht bleichen|keine bleiche/.test(s)) out.push({ src: 'care-bleichen-nichtbleichen', label: 'Nicht bleichen' });
  if (/nicht (im )?trockner|nicht trommeltrocknen|nicht im wäschetrockner/.test(s)) out.push({ src: 'care-trocknen-nichtimtrockner', label: 'Nicht im Trockner' });
  else if (/trommeltrocknen bei niedriger|trockner.{0,20}(niedrig|schonend)/.test(s)) out.push({ src: 'care-trocknen-imtrocknerkalt-60', label: 'Trockner, niedrige Temperatur' });
  else if (/trockner geeignet|trocknergeeignet|im trockner|trommeltrocknen/.test(s)) out.push({ src: 'care-trocknen-imtrockner', label: 'Trockner geeignet' });
  if (/nicht bügeln/.test(s)) out.push({ src: 'care-buegeln-nichtbuegeln', label: 'Nicht bügeln' });
  else if (/bügeln (bei )?(geringer|niedriger)/.test(s)) out.push({ src: 'care-buegeln-kalt-110', label: 'Bügeln, niedrige Temperatur' });
  else if (/bügeln (bei )?(hoher|heiß)/.test(s)) out.push({ src: 'care-buegeln-heiss-200', label: 'Bügeln, hohe Temperatur' });
  else if (/bügeln/.test(s)) out.push({ src: 'care-buegeln-mittel-150', label: 'Bügeln, mittlere Temperatur' });
  if (/nicht chemisch reinigen|nicht trockenreinigen|keine chemische reinigung/.test(s)) out.push({ src: 'care-textilpflege-nichttrockenreinigen-1', label: 'Nicht chemisch reinigen' });
  else if (/chemische reinigung|perchlorethylen/.test(s)) out.push({ src: 'care-textilpflege-trockenreinigungmitpceundoderch', label: 'Chemische Reinigung' });
  return out;
}

/** Grammatur in g/m² (aus Material/Name/Specs) */
export const gsmOf = (p: Product) => { const m = `${p.material ?? ''} ${p.name} ${Object.values(p.specs ?? {}).join(' ')}`.match(/(\d{2,3})\s*g\s*\/?\s*m(²|2)/i); return m ? Number(m[1]) : null; };

const cache = new WeakMap<Product, { features: Picto[]; care: Picto[]; props: string[] }>();
export function pictosFor(p: Product): { features: Picto[]; care: Picto[]; props: string[] } {
  const hit = cache.get(p); if (hit) return hit;
  const specs = Object.entries(p.specs ?? {}).map(([k, v]) => `${k}: ${v}`).join(' · ');
  const text = [p.name, p.description, p.material, p.composition, specs, ...(p.features ?? []), ...(p.tags ?? [])].filter(Boolean).join(' · ');
  const features: Picto[] = [];
  for (const [re, src, label] of FEAT) {
    if (!re.test(text)) continue;
    if (src.startsWith('f-uv') && features.some((x) => x.src.startsWith('f-uv'))) continue;
    if (src.endsWith('-fit') && features.some((x) => x.src.endsWith('-fit'))) continue;
    if (src === 'f-wasserabweisend' && features.some((x) => x.src === 'f-wasserdicht')) continue;
    features.push({ src, label });
  }
  // Stretch nur bei echtem Stretch-Material (nicht wegen Elasthan in Bündchen)
  const ela = (p.composition ?? '').match(/(\d+)\s*%\s*(elasthan|elastan|spandex|lycra)/i);
  if (/stretch/i.test(`${p.name} ${p.description} ${(p.features ?? []).join(' ')}`) || (ela && Number(ela[1]) >= 3)) features.splice(Math.min(features.length, 3), 0, { src: 'f-stretch', label: 'Stretch' });
  if (p.sizes.some((s) => /^[4-8]XL$/.test(s))) features.push({ src: 'f-large-sizes', label: 'Große Größen' });
  // Pflege nur aus Pflegeangaben (Spec „Pflege“ + Merkmale mit Pflegebezug)
  const careText = [p.specs?.['Pflege'] ?? '', p.specs?.['Pflegehinweise'] ?? '', ...(p.features ?? []).filter((f) => /wasch|bügel|trockner|bleich|reinig/i.test(f))].join(' · ');
  const care = careFrom(careText);
  // Filter-Eigenschaften
  const props: string[] = [];
  const has = (src: string) => features.some((x) => x.src === src);
  if (has('f-organic') || has('f-anteilig-aus-recycelten-materialien') || has('f-fairtrade') || /nachhaltig|sustainable|fair wear|oeko-tex|öko-tex/i.test(text)) props.push('Nachhaltig');
  const gsm = gsmOf(p);
  if ((gsm && gsm >= 240) || /heavy|schwere qualität|heavyweight/i.test(text)) props.push('Schwere Qualität');
  if (/oversize|boxy|relaxed/i.test(p.name)) props.push('Oversize');
  if (has('f-wasserdicht') || has('f-wasserabweisend') || has('f-winddicht')) props.push('Wetterschutz');
  if (has('f-stretch')) props.push('Stretch');
  if (has('f-atmungsaktiv') || has('f-fluessigkeitstransportierend') || has('f-schnelltrocknend')) props.push('Sport & Funktion');
  if (has('f-tear-away') || has('f-no-label')) props.push('Ohne Hersteller-Etikett');
  if (has('f-sublimierbarer-artikel')) props.push('Sublimierbar');
  if (has('f-large-sizes')) props.push('Große Größen');
  if (has('f-high-vis') || has('f-reflektorelemente')) props.push('Warnschutz & Reflektoren');
  const r = { features: features.slice(0, 10), care, props };
  cache.set(p, r);
  return r;
}
