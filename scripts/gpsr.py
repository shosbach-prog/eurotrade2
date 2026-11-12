# L-Shop „Manufacturer-contact“-PDF -> seed/gpsr.json (Herstellerangaben je Marke)
import subprocess,sys,json,re
txt=subprocess.run(['pdftotext','-layout',sys.argv[1],'-'],capture_output=True,text=True).stdout
out={}; cur=None; ca=cw=None
for line in txt.split('\n'):
    if 'Marke' in line and 'Adresse' in line: ca=line.index('Adresse'); cw=line.index('WWW'); continue
    if ca is None or not line.strip() or 'Herstellerangaben' in line: continue
    b=a=w=''
    for mt in re.finditer(r'\S(?:.*?\S)?(?=\s{2,}|$)', line):
        st=mt.start(); seg=mt.group(0)
        if st < ca-6: b=seg
        elif st < cw-6: a=seg
        else: w=seg
    if b:
        cur={'firma':'','adresse':[],'kontakt':[]}; out[b]=cur
        if a: cur['firma']=a
    elif cur is not None and a:
        if not cur['firma']: cur['firma']=a
        else: cur['adresse'].append(a)
    if cur is not None and w: cur['kontakt'].append(w)
json.dump(out,open('seed/gpsr.json','w'),ensure_ascii=False,indent=1)
print(len(out))
