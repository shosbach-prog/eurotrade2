# Bildanalyse: wo liegt das Kleidungsstück im Produktfoto? (für die Live-Vorschau)
import json,os,io,sys,time,urllib.request
import numpy as np
from PIL import Image
REPO=os.path.expanduser('~/mnt/euro-tradeneu')
OUT=os.path.expanduser('~/fit/res.json')
res={}
d=json.load(open(os.path.join(REPO,'seed','products.json')))
srcs=[]
for p in d:
    for c in p.get('colors',[]):
        if c.get('image'): srcs.append(c['image'])
    srcs+= p.get('images',[])[:1]
srcs=[s for s in dict.fromkeys(srcs) if s not in res]
t0=time.time(); lim=float(sys.argv[1]) if len(sys.argv)>1 else 150
def load(s):
    if s.startswith('/'): return Image.open(os.path.join(REPO,'public',s.lstrip('/')))
    return Image.open(io.BytesIO(urllib.request.urlopen(s,timeout=15).read()))
n=0
for s in srcs:
    if time.time()-t0>lim: break
    try:
        im=load(s).convert('RGB'); im.thumbnail((400,400))
        a=np.asarray(im).astype(int); h,w,_=a.shape
        border=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]])
        bg=np.median(border,axis=0)
        plain=(np.abs(border-bg).max(axis=1)<14).mean()>0.9 and bg.min()>200
        diff=np.abs(a-bg).max(axis=2)>22
        rows=diff.sum(axis=1); cols=diff.sum(axis=0)
        ys=np.where(rows>w*0.01)[0]; xs=np.where(cols>h*0.01)[0]
        if not bool(plain) or not len(ys) or not len(xs): res[s]={'ok':False}; n+=1; continue
        top,bot=ys[0],ys[-1]; left,right=xs[0],xs[-1]
        # Schulterlinie: erste Zeile, die mindestens 55 % der größten Breite erreicht
        width=np.array([ (np.where(r)[0][-1]-np.where(r)[0][0]) if r.any() else 0 for r in diff])
        mw=width.max(); sh=int(np.argmax(width>=0.55*mw)); sh2=int(np.argmax(width>=0.72*mw))
        # Kapuze / Stehkragen: großer Abstand zwischen beiden Linien -> Schulter liegt tiefer
        hood=False
        # Kapuzenartikel: Schulter = stärkster Breitensprung im oberen Teil (Übergang Kapuze -> Schultern)
        H=bot-top; ws=np.convolve(width,np.ones(3)/3,'same'); k=max(2,H//40)
        lo,hi=top+int(0.04*H),top+int(0.45*H)
        dv=[ws[y+k]-ws[y-k] for y in range(lo,hi)] if hi>lo+1 else [0]
        sj=lo+int(np.argmax(dv))
        # Mittelachse: Schwerpunkt der Pixel im oberen Drittel des Rumpfes
        band=diff[sh:sh+max(3,(bot-sh)//3)]
        cx=np.where(band)[1].mean() if band.any() else (left+right)/2
        # Person im Bild? (Hautton-Anteil)
        r,g,b=a[...,0],a[...,1],a[...,2]
        med=np.median(a[sh:sh+max(3,(bot-sh)//3)][band],axis=0) if band.any() else np.array([0,0,0])
        far=np.abs(a-med).max(axis=2)>45
        Y=0.299*r+0.587*g+0.114*b; Cb=128-0.1687*r-0.3313*g+0.5*b; Cr=128+0.5*r-0.4187*g-0.0813*b
        sk=(Cb>77)&(Cb<127)&(Cr>137)&(Cr<170)&(Y>60)&diff&far
        skin=sk.sum()/max(1,diff.sum())
        S=max(w,h); ox=(S-w)/2; oy=(S-h)/2
        f=lambda v,o: round(float(4+92*(v+o)/S),2)
        res[s]={'ok':bool(skin<0.06),'t':f(top,oy),'s':f(sh,oy),'b':f(bot,oy),'l':f(left,ox),'r':f(right,ox),'cx':f(cx,ox),'skin':round(float(skin),3),'sj':f(sj,oy)}
    except Exception as e:
        res[s]={'ok':False,'err':str(e)[:80]}
    n+=1
json.dump(res,open(OUT,'w'))
print('neu',n,'gesamt',len(res),'offen',len(srcs)-n)
