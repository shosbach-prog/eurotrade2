#!/usr/bin/env python3
"""Legt zu jedem Produktbild (public/p/**/*.jpg) eine .webp-Variante an (falls noch nicht vorhanden).
Aufruf: python3 scripts/webp.py   – der Shop liefert dann automatisch WebP aus."""
import os, sys
from PIL import Image
root = sys.argv[1] if len(sys.argv) > 1 else 'public/p'
n = 0
for d, _, fs in os.walk(root):
    for f in fs:
        if not f.lower().endswith(('.jpg', '.jpeg')): continue
        src = os.path.join(d, f); dst = os.path.splitext(src)[0] + '.webp'
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src): continue
        Image.open(src).convert('RGB').save(dst, 'WEBP', quality=80, method=4); n += 1
print(f'{n} WebP-Bilder erzeugt')
