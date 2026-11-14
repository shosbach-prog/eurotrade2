import 'server-only';
import crypto from 'node:crypto';
import { site } from './agent-md';

/** Agent-Skill: wie KI-Agenten im Shop suchen, Artikel lesen und Anfragen vorbereiten */
export function shopSkill() {
  const s = site();
  return `---
name: euro-trade-shop
description: Markentextilien und Werbeartikel bei euro-trade.com finden, Preise und Farben lesen und eine Anfrage mit Druck oder Stick vorbereiten.
---

# euro-trade.com für Agenten

## Artikel finden
- Suche (JSON): \`GET ${s}/api/search?q=<Begriff>&limit=20\` → \`items[]\` mit name, brand, sku, category, price (netto, EUR), images.
- Übersicht und Kategorien: ${s}/llms.txt
- Jede Seite als Markdown: Anfrage mit Header \`Accept: text/markdown\` (Startseite, Kategorien, Artikel).
- Vollständiger Produkt-Feed (XML, Preise inkl. MwSt.): ${s}/feed/google.xml

## Artikel lesen
Artikel-URLs haben die Form \`${s}/<kategorie>/<artikel>-<artnr>\`. Die Markdown-Fassung enthält Marke, Art.-Nr., Preis netto/brutto, Staffelpreise, Farben, Größen und Beschreibung.

## Bestellen / Anfrage
Eine Bestellung schließt immer der Mensch selbst ab: Link zum Artikel geben; dort Farbe, Größen und Menge wählen, optional Logo hochladen (Druck oder Stick ab 1 Stück) und die Anfrage absenden. Verbindliches Angebot innerhalb von 24 Stunden.
Kontakt: info@euro-trade.com · Telefon 030 40719258
`;
}
export const sha256 = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
