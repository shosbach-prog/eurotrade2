#!/usr/bin/env python3
"""Hochauflösende Produktbilder aus einem L-Shop-Bildpaket übernehmen.

Aufruf:  python3 scripts/bilder-import.py "<Ordner mit dem entpackten Bildpaket>" [--alle]

Erwartet die L-Shop-Struktur  <Marke>/<ART-NR>/<ART-NR>[_1_Front|_2_Back|_<Farbe>].jpg
(flache Ordner wie „_web images … 1556x2000px/<ART-NR>.jpg“ gehen auch).
Für jeden Artikel im Shop werden die Bilder auf max. 1000 px verkleinert, nach public/p/kat/<ART-NR>/
geschrieben (inkl. .webp) und in seed/products.json eingetragen:
  - Ansichten (Hauptbild, Front, Back, Side, Detail) → Bildergalerie
  - Farbbilder (<ART-NR>_<Farbe>.jpg) → Bild der passenden Farbe
Ohne --alle werden nur Artikel aktualisiert, die bisher nur das kleine Katalogbild (main.jpg) haben.
"""
import os, re, sys, json, glob
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else None
if not src or not os.path.isdir(src): sys.exit(__doc__)
ALL = '--alle' in sys.argv
SEED = 'seed/products.json'
ps = json.load(open(SEED, encoding='utf-8'))
by = {p['sku'].upper(): p for p in ps}
sl = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

files = {}
for f in glob.glob(os.path.join(src, '**', '*.jp*g'), recursive=True):
    if '420x540' in f: continue
    b = os.path.splitext(os.path.basename(f))[0]
    m = re.match(r'^([A-Za-z0-9]+?)(?:_(.*))?$', b)
    sku = m.group(1).upper() if m else ''
    # Art.-Nr. kann Unterstriche nicht enthalten – längsten passenden Präfix nehmen
    for cand in sorted({b[:i] for i in range(2, len(b) + 1)}, key=len, reverse=True):
        if cand.upper() in by and (len(cand) == len(b) or b[len(cand)] == '_'): sku = cand.upper(); break
    if sku in by: files.setdefault(sku, []).append(f)

done = 0
for sku, fs in sorted(files.items()):
    p = by[sku]
    if not ALL and not (len(p['images']) <= 1 and all('/p/kat/' in i for i in p['images'])): continue
    out = f'public/p/kat/{sku}'; os.makedirs(out, exist_ok=True)
    views, cols = [], {}
    for f in sorted(fs, key=lambda x: (len(x), x)):
        rest = os.path.splitext(os.path.basename(f))[0][len(sku):].lstrip('_')
        m = re.match(r'^(\d+)_(.*)$', rest)
        name = 'main' if not rest else f'{sl(m.group(2))}-{m.group(1)}' if m else sl(rest)
        im = Image.open(f).convert('RGB'); im.thumbnail((1000, 1000))
        im.save(f'{out}/{name}.jpg', 'JPEG', quality=84, optimize=True); im.save(f'{out}/{name}.webp', 'WEBP', quality=80)
        url = f'/p/kat/{sku}/{name}.jpg'
        if not rest or m: views.append((0 if not rest else int(m.group(1)), url))
        else: cols[sl(rest)] = url
    if views: p['images'] = [u for _, u in sorted(views)]
    for c in p['colors']:
        k = sl(c['name']); hit = cols.get(k) or cols.get(k.replace('dark-', 'dk-')) or cols.get(k.replace('-', ''))
        if hit: c['image'] = hit; c['images'] = [hit]
    if not p['images'] and cols: p['images'] = [next(iter(cols.values()))]
    done += 1
json.dump(ps, open(SEED, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{done} Artikel mit neuen Bildern aktualisiert ({len(files)} Artikel im Paket gefunden).')
