import type { PublicProduct } from './types';

/** Saison-/Aktionsseiten unter /aktion/<slug> – Artikelauswahl per Regel, Texte nur mit Fakten */
export type Aktion = {
  slug: string; nav: string; title: string; desc: string; kicker: string; h1: string; lead: string;
  /** Liefer-Stichtag (MM-DD) – daraus wird „bitte bis … freigeben“ berechnet */
  deadline?: string; deadlineLabel?: string;
  points: [string, string][]; faq: [string, string][]; example: string; refMatch: string[];
  pick: (p: PublicProduct) => number; // 0 = nicht zeigen, höher = weiter vorn
};
const txt = (p: PublicProduct) => `${p.name} ${p.category} ${(p.tags ?? []).join(' ')}`.toLowerCase();

export const AKTIONEN: Aktion[] = [
  {
    slug: 'workwear', nav: 'Workwear', kicker: 'Für Handwerk & Betrieb', title: 'Workwear mit Firmenlogo – Arbeitskleidung bedrucken & besticken',
    desc: 'Robuste Workwear mit Ihrem Firmenlogo: Fleecejacken, Softshelljacken, Arbeitshosen, Workwear-T-Shirts und Sweatshirts – bestickt oder bedruckt ab 1 Stück. Angebot in 24 Stunden.',
    h1: 'Workwear mit Ihrem Firmenlogo', lead: 'Fleece- und Softshelljacken, Stretch-Arbeitshosen und industriewäschefeste Shirts – mit gesticktem oder gedrucktem Logo, einheitlich für das ganze Team.',
    points: [['Strapazierfähig', 'Verstärkte Nähte, CORDURA®-Kniepolstertaschen, Anti-Pilling-Fleece – gemacht für den Arbeitsalltag.'], ['Logo hält', 'Stick für Jacken und Fleece, Transferdruck für Shirts – waschfest, auch bei höheren Temperaturen.'], ['Nachbestellen ab 1 Stück', 'Neue Mitarbeiter bekommen dieselbe Kleidung mit demselben Logo.'], ['Ein Ansprechpartner', 'Angebot, Vorschau zur Freigabe und Lieferung aus einer Hand.']],
    faq: [['Welche Veredelung eignet sich für Arbeitsjacken?', 'Für Fleece- und Softshelljacken empfehlen wir Stick – er ist besonders langlebig. Viele Jacken haben einen Veredelungszugang, damit das Futter nicht mitbestickt wird.'], ['Gibt es passende Damenmodelle?', 'Bei vielen Artikeln ja – sie werden auf der Artikelseite unter „Gleicher Artikel – anderer Schnitt“ angezeigt.'], ['Wie lange dauert die Lieferung?', 'Nach Freigabe der Vorschau meist 7–14 Werktage.']],
    example: 'z. B. 12 Fleecejacken und 24 T-Shirts mit Logo auf der Brust', refMatch: ['workwear', 'handwerk', 'arbeitskleidung'],
    pick: (p) => { const t = txt(p); return /workwear|arbeits|strong/.test(t) ? 3 : p.category === 'Arbeitskleidung' ? 2 : /softshell|fleece/.test(t) ? 1 : 0; },
  },
  {
    slug: 'weihnachtsgeschenke-mitarbeiter', nav: 'Weihnachtsgeschenke', kicker: 'Weihnachten', title: 'Weihnachtsgeschenke für Mitarbeiter mit Firmenlogo',
    desc: 'Hoodies, Decken, Mützen und Jacken mit Firmenlogo als Weihnachtsgeschenk für Mitarbeiter und Kunden – bestickt oder bedruckt, rechtzeitig vor Weihnachten geliefert.',
    h1: 'Weihnachtsgeschenke mit Ihrem Logo', lead: 'Ein Geschenk, das getragen wird: kuschelige Hoodies, Sherpa-Decken und Beanies mit Ihrem Logo – für Mitarbeiter, Kunden und Partner.',
    deadline: '12-23', deadlineLabel: 'Lieferung vor Weihnachten',
    points: [['Wird wirklich genutzt', 'Hoodies, Decken und Mützen landen nicht in der Schublade, sondern im Alltag.'], ['Mit Namen', 'Auf Wunsch mit dem Vornamen jedes Mitarbeiters – einfach als Liste mitschicken.'], ['Ab 1 Stück', 'Für kleine Teams genauso wie für große Belegschaften.'], ['Termin im Blick', 'Wir nennen Ihnen beim Angebot verbindlich, bis wann die Freigabe nötig ist.']],
    faq: [['Bis wann muss ich bestellen?', 'Entscheidend ist die Freigabe der Vorschau. Den spätesten Termin sehen Sie oben auf dieser Seite und im Warenkorb.'], ['Kann jeder Mitarbeiter eine andere Größe bekommen?', 'Ja. Tragen Sie die Größen einfach ein oder nutzen Sie „Gesamtmenge auf Größen verteilen“.'], ['Gibt es Geschenkverpackung?', 'Fragen Sie gern im Anfrageformular – wir prüfen, was möglich ist.']],
    example: 'z. B. 30 Hoodies mit Logo und Vornamen', refMatch: ['weihnachten', 'geschenk'],
    pick: (p) => { const t = txt(p); return /decke|blanket/.test(t) ? 3 : /beanie|mütze|muetze/.test(t) ? 2 : /hood|kapuze|sweat/.test(t) ? 1 : 0; },
  },
  {
    slug: 'vereinsausstattung', nav: 'Vereinsausstattung', kicker: 'Für Vereine', title: 'Vereinsausstattung zur neuen Saison – mit Logo, Namen & Nummern',
    desc: 'Vereinsausstattung für Rückrunde und neue Saison: Hoodies, Jacken, T-Shirts und Polos mit Vereinslogo, Namen und Nummern – ab 1 Stück nachbestellbar, auch als Vereinsshop.',
    h1: 'Vereinsausstattung für die neue Saison', lead: 'Einheitlich auftreten: Hoodies, Trainingsjacken, Shirts und Polos mit Vereinslogo – auf Wunsch mit Namen und Nummern für jedes Mitglied.',
    points: [['Teamliste einfügen', 'Namen, Nummern und Größen direkt aus Excel einfügen – wir übernehmen den Rest.'], ['Vereinsshop', 'Mitglieder bestellen selbst über einen eigenen Link, alles mit Ihrem Logo.'], ['Gemischte Teams', 'Damen-, Herren- und Kinderschnitte im gleichen Look.'], ['Staffelpreise', 'Je mehr Teile, desto günstiger – auch über mehrere Farben und Größen.']],
    faq: [['Können Mitglieder einzeln bestellen?', 'Ja, mit einem Vereinsshop. Jeder bestellt selbst, die Lieferung kommt gesammelt.'], ['Gibt es Kindergrößen?', 'Bei vielen Artikeln gibt es Kindermodelle im gleichen Look.'], ['Was kostet die Personalisierung?', 'Namen und Nummern werden je Teil berechnet – Sie sehen den Preis im Angebot.']],
    example: 'z. B. 25 Hoodies mit Vereinslogo, Namen und Nummern', refMatch: ['verein', 'sport', 'team'],
    pick: (p) => { const t = txt(p); return /hood|kapuze|zip/.test(t) ? 3 : /sweat|jacke|jacket/.test(t) ? 2 : /t-shirt|polo/.test(t) ? 1 : 0; },
  },
];
export const aktion = (slug: string) => AKTIONEN.find((a) => a.slug === slug);
