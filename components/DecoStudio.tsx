'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cmFor, spotsFor, type View } from '@/lib/deco-layout';
import { colorHex, fontCss } from '@/lib/deco';

export type Place = Record<string, { x: number; y: number; w: number }>;
type Props = {
  product: { category?: string; name?: string };
  colorHex?: string; photo?: string | null;
  positions: string[]; active: string | null; setActive: (p: string) => void;
  place: Place; setPlace: (p: Place) => void;
  logoSrc?: string | null; text?: string; font?: string; textColor?: string;
  method: string; compact?: boolean;
};

const lum = (hex?: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? ''); if (!m) return 1; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

/** Standard-Lage je Position (für neue Positionen) */
export function defaultPlace(product: { category?: string; name?: string }, pos: string) {
  const s = spotsFor(product).spots[pos];
  return s ? { x: s.x, y: s.y, w: s.w } : null;
}

/** Live-Vorschau: Motiv in der Artikelfarbe an der gewählten Position – verschieben per Ziehen, Größe per Regler */
export default function DecoStudio(props: Props) {
  const { product, positions, active, setActive, place, setPlace, logoSrc, text = '', font, textColor, method, compact } = props;
  const { kind, spots, shape: base } = useMemo(() => spotsFor(product), [product]);
  // Hoodies bekommen Kapuze und Bauchtasche in der Skizze
  const label = `${product.name} ${product.category}`;
  const hoodie = kind === 'oberteil' && /hood|kapuz/i.test(label);
  // Langarm-Artikel: lange Ärmel in der Skizze
  const LONG = 'M36 11 L22 15 L11 30 L5 80 L15 82 L22 46 L22 95 L78 95 L78 46 L85 82 L95 80 L89 30 L78 15 L64 11 Q50 22 36 11 Z';
  const longArm = kind === 'oberteil' && /hood|kapuz|sweat|jacke|jacket|fleece|langarm|long ?sleeve|hemd|softshell|pullover|bodywarmer/i.test(label) && !/bodywarmer|weste|vest/i.test(label);
  const base2 = longArm ? { ...base, front: [LONG], back: [LONG.replace('Q50 22 36 11', 'Q50 15 36 11')] } : base;
  const shape = hoodie ? { ...base2, front: [...base2.front, 'M35 12 Q50 -1 65 12 Q50 24 35 12 Z'], detail: ['M35 12 Q50 24 65 12', 'M33 66 H67 L71 86 H29 Z', 'M47 18 L46 34 M53 18 L54 34'], back: [...(base2.back ?? base2.front), 'M35 12 Q50 -6 65 12 Q50 30 35 12 Z'] } : base2;
  const known = positions.filter((p) => spots[p]);
  const cur = active && spots[active] ? active : known[0] ?? null;
  const [view, setView] = useState<View>(cur ? spots[cur].view : 'front');
  const [photoMode, setPhotoMode] = useState(!!props.photo);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pos: string; dx: number; dy: number } | null>(null);

  useEffect(() => { if (cur) setView(spots[cur].view); }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPhotoMode(!!props.photo); }, [props.photo]);

  const hex = props.colorHex ?? '#d9dde3';
  const light = lum(hex) > 0.62;
  const hasBack = !!shape.back || known.some((p) => spots[p].view === 'back');
  const showPhoto = photoMode && view === 'front' && !!props.photo;
  const inView = known.filter((p) => spots[p].view === view);
  const lines = text.split('\n').filter((l) => l.trim());
  const longest = Math.max(1, ...lines.map((l) => l.length));
  const hasMotif = !!logoSrc || lines.length > 0;

  function pt(e: React.PointerEvent) {
    const r = stage.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  }
  function down(e: React.PointerEvent, pos: string) {
    e.preventDefault(); e.stopPropagation();
    setActive(pos);
    const p = pt(e), cur = place[pos];
    drag.current = { pos, dx: p.x - cur.x, dy: p.y - cur.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    const d = drag.current; if (!d) return;
    const p = pt(e), s = spots[d.pos], c = place[d.pos];
    const [x0, y0, x1, y1] = s.area;
    const x = Math.min(x1 - c.w / 2, Math.max(x0 + c.w / 2, p.x - d.dx));
    const y = Math.min(y1 - 2, Math.max(y0 + 2, p.y - d.dy));
    setPlace({ ...place, [d.pos]: { ...c, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } });
  }
  const up = () => { drag.current = null; };

  function setWidth(pos: string, w: number) {
    const s = spots[pos], c = place[pos];
    const [x0, , x1] = s.area;
    const ww = Math.max(3, Math.min(x1 - x0, w));
    setPlace({ ...place, [pos]: { ...c, w: ww, x: Math.min(x1 - ww / 2, Math.max(x0 + ww / 2, c.x)) } });
  }
  const maxW = cur ? spots[cur].area[2] - spots[cur].area[0] : 40;

  return (
    <div className={`ds-studio ${compact ? 'compact' : ''}`}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="et-stitch" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4 0.35" numOctaves="1" seed="3" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.55 1.08" result="a" />
          <feComposite in="SourceGraphic" in2="a" operator="in" result="t" />
          <feDropShadow in="t" dx="0" dy="0.6" stdDeviation="0.5" floodColor="#000" floodOpacity=".45" />
        </filter>
      </svg>

      <div className="ds-bar">
        <div className="seg">
          <button type="button" className={view === 'front' ? 'on' : ''} onClick={() => setView('front')}>Vorderseite</button>
          {hasBack && <button type="button" className={view === 'back' ? 'on' : ''} onClick={() => setView('back')}>Rückseite</button>}
        </div>
        {props.photo && view === 'front' && <div className="seg">
          <button type="button" className={photoMode ? 'on' : ''} onClick={() => setPhotoMode(true)}>Foto</button>
          <button type="button" className={!photoMode ? 'on' : ''} onClick={() => setPhotoMode(false)}>Skizze</button>
        </div>}
      </div>

      <div className="ds-stage" ref={stage} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
        {showPhoto ? <img className="ds-photo" src={props.photo!} alt="" draggable={false} onError={() => setPhotoMode(false)} /> : (
          <svg viewBox="0 0 100 100" className="ds-shape" aria-hidden>
            <defs>
              <linearGradient id="ds-shade" x1="0" x2="1"><stop offset="0" stopColor="#000" stopOpacity=".10" /><stop offset=".5" stopColor="#fff" stopOpacity=".06" /><stop offset="1" stopColor="#000" stopOpacity=".12" /></linearGradient>
            </defs>
            {(view === 'back' && shape.back ? shape.back : shape.front).map((d, k) => <g key={k}><path d={d} fill={hex} stroke="rgba(0,0,0,.22)" strokeWidth=".5" strokeLinejoin="round" /><path d={d} fill="url(#ds-shade)" /></g>)}
            {view === 'front' && shape.detail?.map((d, k) => <path key={k} d={d} fill="none" stroke="rgba(0,0,0,.25)" strokeWidth=".5" />)}
          </svg>
        )}
        {/* Druckbereich der aktiven Position */}
        {cur && spots[cur].view === view && (() => { const [x0, y0, x1, y1] = spots[cur].area; return <div className="ds-area" style={{ left: `${x0}%`, top: `${y0}%`, width: `${x1 - x0}%`, height: `${y1 - y0}%` }} />; })()}
        {hasMotif && inView.map((pos) => {
          const c = place[pos]; if (!c) return null;
          const on = pos === cur;
          return (
            <div key={pos} className={`ds-motif ${on ? 'on' : ''} ${method === 'Stick' ? 'stitch' : 'print'} ${light ? 'on-light' : 'on-dark'}`}
              style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%` }} onPointerDown={(e) => down(e, pos)} title={`${pos} – ziehen zum Verschieben`}>
              {logoSrc && <img src={logoSrc} alt="" draggable={false} />}
              {lines.length > 0 && <div className="ds-text" style={{ fontFamily: fontCss(font), color: colorHex(textColor), fontSize: `${Math.min(34, 150 / longest)}cqw` }}>{lines.map((l, k) => <div key={k}>{l}</div>)}</div>}
              {on && <span className="ds-size">{cmFor(kind, c.w)} cm</span>}
            </div>
          );
        })}
        {!hasMotif && <div className="ds-empty">Logo hochladen oder Text eingeben – die Vorschau erscheint hier</div>}
        {hasMotif && !inView.length && known.length > 0 && <button type="button" className="ds-empty ds-switch" onClick={() => setView(view === 'front' ? 'back' : 'front')}>Ihr Motiv ist auf der {view === 'front' ? 'Rückseite' : 'Vorderseite'} → ansehen</button>}
      </div>

      {hasMotif && known.length > 0 && <div className="ds-ctrl">
        {known.length > 1 && <div className="ds-tabs">{known.map((p) => <button key={p} type="button" className={p === cur ? 'on' : ''} onClick={() => setActive(p)}>{p}</button>)}</div>}
        {cur && place[cur] && <>
          <label className="ds-range">
            <span>Größe <b>{cmFor(kind, place[cur].w)} cm</b> breit</span>
            <input type="range" min={3} max={Math.round(maxW)} step={0.5} value={place[cur].w} onChange={(e) => setWidth(cur, Number(e.target.value))} />
          </label>
          <button type="button" className="linkbtn" onClick={() => { const d = defaultPlace(product, cur); if (d) setPlace({ ...place, [cur]: d }); }}>Standard-Position</button>
        </>}
      </div>}
      <p className="ds-note">Vorschau zur Orientierung – Motiv ziehen zum Verschieben. Vor der Produktion erhalten Sie eine exakte Vorschau zur Freigabe.</p>
    </div>
  );
}
