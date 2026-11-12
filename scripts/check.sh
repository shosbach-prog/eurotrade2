#!/bin/bash
# Kontrolle nach dem Hochladen: Sind die wichtigsten Seiten erreichbar?
# Aufruf: bash scripts/check.sh [https://euro-trade.com]
BASE="${1:-https://euro-trade.com}"
URLS="/ /start /t-shirts /jacken /taschen-rucksaecke /kapuzenpullover /t-shirts-herren /auslaufartikel /sonderangebote /suche?q=polo /marken /kontakt /produktsicherheit /aktion/weihnachtsgeschenke-mitarbeiter /sitemap.xml /robots.txt /feed/google.xml"
# eine echte Artikelseite aus der Sitemap
P=$(curl -fsS -m 20 "$BASE/sitemap.xml" 2>/dev/null | grep -o "<loc>https://[^/]*/[a-z0-9-]*/[a-z0-9-]*</loc>" | grep -v "/fuer/\|/aktion/\|/marken/\|/ratgeber/" | sed -n '30p' | sed 's/<[^>]*>//g' | sed "s#$BASE##")
[ -n "$P" ] && URLS="$URLS $P"
fail=0; echo ">> Prüfe $BASE …"
sleep 5
for u in $URLS; do
  code=$(curl -s -o /dev/null -m 30 -w "%{http_code}" "$BASE$u")
  case "$code" in 200|301|302|303|307|308|404) ;; *) ;; esac
  if [ "$code" = "200" ] || [ "$code" = "307" ] || [ "$code" = "308" ] || { [ "$u" = "/feed/google.xml" ] && [ "$code" = "404" ]; }; then echo "   ok   $code  $u"; else echo "   FEHLER $code  $u"; fail=1; fi
done
if [ $fail = 0 ]; then echo ">> Alles erreichbar."; else echo ">> ACHTUNG: Mindestens eine Seite antwortet nicht korrekt – bitte melden."; exit 1; fi
