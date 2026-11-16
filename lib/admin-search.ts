// Suche in den Admin-Listen (Artikelauswahl, Artikelliste) – läuft im Browser, keine Server-Abhängigkeiten.

/** klein, ohne Akzente; ß → ss */
const plain = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
/** nur Buchstaben und Ziffern – „#E150“, „E 150“ und „e150“ werden gleich, ebenso „ID.001“ und „id001“ */
const compact = (s: string) => plain(s).replace(/[^a-z0-9]/g, '');

/** Suchtext eines Artikels einmal vorbereiten (Artikelnummer, Name, Herstellerbezeichnung, Marke) */
export function searchKey(fields: (string | null | undefined)[]) {
  const t = plain(fields.filter(Boolean).join(' '));
  // je Wort kompaktieren, Wörter getrennt lassen – sonst trifft „stau“ auch „selbst. Auch“
  return { t, c: t.split(/\s+/).map(compact).join(' ') };
}

/** Jedes Suchwort muss vorkommen – wörtlich oder ohne Satz-/Sonderzeichen */
export function matches(key: { t: string; c: string }, query: string) {
  const words = plain(query).split(/\s+/).filter(Boolean);
  return words.every((w) => {
    if (key.t.includes(w)) return true;
    const cw = compact(w);
    return !!cw && key.c.includes(cw);
  });
}
