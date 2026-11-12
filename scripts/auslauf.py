# L-Shop-Auslaufliste (xlsx) -> seed/auslauf.json (nur Artikel/Farben/Größen, die im Shop sind)
# Aufruf: python3 scripts/auslauf.py "Auslaufartikel - Stand XX.XX.XXXX.de.xlsx"
import json,collections,re,sys,openpyxl
src=sys.argv[1]
d=json.load(open('seed/products.json')); have={p['sku'].upper():p for p in d}
ws=openpyxl.load_workbook(src,read_only=True).worksheets[0]
rows=list(ws.iter_rows(values_only=True))[1:]
nc=lambda c: re.sub(r'\s+',' ',str(c).replace(' | ',' / ').replace('|','/').strip().lower())
ns=lambda s: re.sub(r'\s*\(.*?\)\s*','',str(s)).strip().lower()
m=collections.defaultdict(list)
for r in rows: m[str(r[1]).upper()].append(r)
out={}
for sku,rs in m.items():
    p=have.get(sku)
    if not p: continue
    sizes=[ns(s) for s in (p['sizes'] or ['one size'])]
    disc=collections.defaultdict(dict)
    for r in rs:
        dt=r[6].date().isoformat() if r[6] else None
        disc[nc(r[2])][ns(r[3]) if str(r[3]) not in ('-','None') else 'one size']=dt
    colors={}
    for c in p['colors']:
        e=disc.get(nc(c['name']))
        if not e: continue
        if not p['sizes'] and ('one size' in e or len(e)): sz=None
        else: sz=[s for s in p['sizes'] if ns(s) in e]
        if p['sizes'] and not sz: continue
        dates=[x for x in e.values() if x]
        colors[c['name']]={'sizes': None if sz is None or len(sz)==len(p['sizes']) else sz, 'date': max(dates) if dates else None}
    if not colors: continue
    allc=len(colors)==len(p['colors']) and all(v['sizes'] is None for v in colors.values())
    dates=[v['date'] for v in colors.values() if v['date']]
    out[sku]={'all':allc,'date':max(dates) if allc and dates and all(v['date'] for v in colors.values()) else (max(dates) if dates else None),'colors':colors}
json.dump({'stand':re.search(r'(\d\d\.\d\d\.\d{4})',src).group(1) if re.search(r'(\d\d\.\d\d\.\d{4})',src) else '', 'items':out},open('seed/auslauf.json','w'),ensure_ascii=False,indent=1)
print('Artikel',len(out),'komplett',sum(v['all'] for v in out.values()),'Farben',sum(len(v['colors']) for v in out.values()))
