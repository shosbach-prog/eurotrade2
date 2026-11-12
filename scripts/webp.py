#!/usr/bin/env python3
"""Legt zu jedem Produktbild (public/p/**/*.jpg) eine .webp-Variante und eine kleine .m.webp (480 px) an.
Aufruf: python3 scripts/webp.py   – der Shop liefert dann automatisch WebP aus."""
import os, sys
from PIL import Image
root = sys.argv[1] if len(sys.argv) > 1 else 'public/p'
n = 0
for d, _, fs in os.walk(root):
    for f in fs:
        if not f.lower().endswith(('.jpg', '.jpeg')): continue
        src = os.path.join(d, f); base = os.path.splitext(src)[0]
        dst, mid = base + '.webp', base + '.m.webp'   # volle Größe + 480 px für Kacheln/Vorschaubilder
        im = None
        if not (os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)):
            im = Image.open(src).convert('RGB'); im.save(dst, 'WEBP', quality=80, method=4); n += 1
        if not (os.path.exists(mid) and os.path.getmtime(mid) >= os.path.getmtime(src)):
            im = im or Image.open(src).convert('RGB'); t = im.copy(); t.thumbnail((480, 480)); t.save(mid, 'WEBP', quality=78, method=4); n += 1
print(f'{n} WebP-Bilder erzeugt')
