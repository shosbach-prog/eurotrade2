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
  /** Bildanalyse des Fotos: [oben, Schulter, Schulter bei Kapuze, unten, Mittelachse] in % der Bühne */
  fit?: FitT | null;
  /** Lage-Anker je Position für dieses Foto: [x, y, Breite, Drehung] – überschreibt die automatische Ausrichtung */
  anchor?: Record<string, Anchor> | null;
  /** Admin: Lage für dieses Foto speichern */
  admin?: boolean;
};
export type Anchor = [number, number, number, number];

/** Bezugslinien der Skizze je Artikelart (oben/unten in %), an denen das Foto ausgerichtet wird */
const REF: Partial<Record<string, { top: number; bottom: number; shoulder?: boolean }>> = {
  oberteil: { top: 14, bottom: 95, shoulder: true }, hose: { top: 6, bottom: 95 }, tasche: { top: 8, bottom: 94 },
  cap: { top: 27, bottom: 80 }, muetze: { top: 22, bottom: 80 }, schuerze: { top: 2, bottom: 95 }, unterwaesche: { top: 22, bottom: 70 },
};
export type Tf = { s: number; ox: number; oy: number; rt: number; rot?: number };
export const ident: Tf = { s: 1, ox: 50, oy: 0, rt: 0 };
export type FitT = [number, number, number, number, number] | [number, number, number, number, number, number];
/** Anker → Ausrichtung: die Standard-Lage der Position landet genau auf dem Anker */
export function anchorTf(spot: { x: number; y: number; w: number }, a: Anchor): Tf {
  const s = a[2] / spot.w;
  return { s, ox: a[0] - (spot.x - 50) * s, oy: a[1], rt: spot.y, rot: a[3] };
}

/** Skizze je Artikel (Hoodie mit Kapuze, Langarm usw.) */
export function shapeFor(product: { category?: string; name?: string }) {
  const { kind, spots, shape: base } = spotsFor(product);
  const label = `${product.name} ${product.category}`;
  const hoodie = kind === 'oberteil' && /hood|kapuz/i.test(label);
  const LONG = 'M36 11 L22 15 L11 30 L5 80 L15 82 L22 46 L22 95 L78 95 L78 46 L85 82 L95 80 L89 30 L78 15 L64 11 Q50 22 36 11 Z';
  const longArm = kind === 'oberteil' && /hood|kapuz|sweat|jacke|jacket|fleece|langarm|long ?sleeve|hemd|softshell|pullover|bodywarmer/i.test(label) && !/bodywarmer|weste|vest/i.test(label);
  const base2 = longArm ? { ...base, front: [LONG], back: [LONG.replace('Q50 22 36 11', 'Q50 15 36 11')] } : base;
  const shape = hoodie ? { ...base2, front: [...base2.front, 'M35 12 Q50 -1 65 12 Q50 24 35 12 Z'], detail: ['M35 12 Q50 24 65 12', 'M33 66 H67 L71 86 H29 Z', 'M47 18 L46 34 M53 18 L54 34'], back: [...(base2.back ?? base2.front), 'M35 12 Q50 -6 65 12 Q50 30 35 12 Z'] } : base2;
  return { kind, spots, shape, hoodie };
}
/** Ausrichtung am echten Artikel im Foto: Skizzen-Koordinaten -> Foto-Koordinaten (gleichmäßig skaliert) */
export function photoTf(kind: string, fit: FitT | null | undefined, hoodie: boolean): Tf {
  const r = REF[kind];
  if (!r || !fit) return ident;
  const top = r.shoulder ? (hoodie ? fit[2] : fit[1]) : fit[0];
  const s = (fit[3] - top) / (r.bottom - r.top);
  if (!(s > 0.3 && s < 2)) return ident;
  return { s, ox: fit[4], oy: top, rt: r.top };
}

export const lum = (hex?: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? ''); if (!m) return 1; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

/** Standard-Lage je Position (für neue Positionen) */
export function defaultPlace(product: { category?: string; name?: string }, pos: string) {
  const s = spotsFor(product).spots[pos];
  return s ? { x: s.x, y: s.y, w: s.w } : null;
}

/** Live-Vorschau: Motiv in der Artikelfarbe an der gewählten Position – verschieben per Ziehen, Größe per Regler */
export default function DecoStudio(props: Props) {
  const { product, positions, active, setActive, place, setPlace, logoSrc, text = '', font, textColor, method, compact } = props;
  const { kind, spots, shape, hoodie } = useMemo(() => shapeFor(product), [product]);
  const known = positions.filter((p) => spots[p]);
  const cur = active && spots[active] ? active : known[0] ?? null;
  const [view, setView] = useState<View>(cur ? spots[cur].view : 'front');
  // Foto nur als Vorschau nutzen, wenn die Bildanalyse den Artikel sicher erkannt hat (kein Model-Foto)
  const canPhoto = !!props.photo && (!!props.fit || !!props.anchor);
  const [photoMode, setPhotoMode] = useState(canPhoto);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pos: string; dx: number; dy: number } | null>(null);

  useEffect(() => { if (cur) setView(spots[cur].view); }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPhotoMode(canPhoto); }, [props.photo, canPhoto]);

  const hex = props.colorHex ?? '#d9dde3';
  const light = lum(hex) > 0.62;
  const hasBack = !!shape.back || known.some((p) => spots[p].view === 'back');
  const showPhoto = photoMode && view === 'front' && !!props.photo;
  // Ausrichtung am echten Artikel im Foto: Skizzen-Koordinaten -> Foto-Koordinaten (gleichmäßig skaliert)
  const tf: Tf = useMemo(() => (showPhoto ? photoTf(kind, props.fit, hoodie) : ident), [showPhoto, kind, props.fit, hoodie]);
  // Admin-Feinjustage (nur zum Speichern eines Ankers)
  const [adj, setAdj] = useState<{ s: number; rot: number } | null>(null);
  const [saved, setSaved] = useState('');
  const [localAnchor, setLocalAnchor] = useState<Record<string, Anchor> | null>(null);
  useEffect(() => { setLocalAnchor(null); setAdj(null); }, [props.photo]);
  const anc = localAnchor ? { ...(props.anchor ?? {}), ...localAnchor } : props.anchor;
  const tfOf = (pos: string | null): Tf => {
    let t = tf;
    if (showPhoto && pos && anc?.[pos] && spots[pos]) t = anchorTf(spots[pos], anc[pos]);
    if (adj && pos === cur && showPhoto) t = { ...t, s: t.s * adj.s, rot: (t.rot ?? 0) + adj.rot };
    return t;
  };
  const toX = (x: number, t = tf) => t.ox + (x - 50) * t.s, toY = (y: number, t = tf) => t.oy + (y - t.rt) * t.s;
  const fromX = (x: number, t = tf) => (x - t.ox) / t.s + 50, fromY = (y: number, t = tf) => (y - t.oy) / t.s + t.rt;
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
    const t = tfOf(pos), q = pt(e), p = { x: fromX(q.x, t), y: fromY(q.y, t) }, cur = place[pos];
    drag.current = { pos, dx: p.x - cur.x, dy: p.y - cur.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    const d = drag.current; if (!d) return;
    const t = tfOf(d.pos), q = pt(e), p = { x: fromX(q.x, t), y: fromY(q.y, t) }, s = spots[d.pos], c = place[d.pos];
    // Admin auf dem Foto: frei verschieben (zum Festlegen der Lage), sonst innerhalb des Druckbereichs
    const free = !!props.admin && showPhoto;
    const [x0, y0, x1, y1] = free ? [-50, -50, 150, 150] : s.area;
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
        {canPhoto && view === 'front' && <div className="seg">
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
        {cur && spots[cur].view === view && (() => { const t = tfOf(cur), [x0, y0, x1, y1] = spots[cur].area; return <div className="ds-area" style={{ left: `${toX(x0, t)}%`, top: `${toY(y0, t)}%`, width: `${(x1 - x0) * t.s}%`, height: `${(y1 - y0) * t.s}%`, transform: t.rot ? `rotate(${t.rot}deg)` : undefined }} />; })()}
        {hasMotif && inView.map((pos) => {
          const c = place[pos]; if (!c) return null;
          const on = pos === cur, t = tfOf(pos);
          return (
            <div key={pos} className={`ds-motif ${on ? 'on' : ''} ${method === 'Stick' ? 'stitch' : 'print'} ${light ? 'on-light' : 'on-dark'}`}
              style={{ left: `${toX(c.x, t)}%`, top: `${toY(c.y, t)}%`, width: `${c.w * t.s}%`, transform: t.rot ? `translate(-50%,-50%) rotate(${t.rot}deg)` : undefined }} onPointerDown={(e) => down(e, pos)} title={`${pos} – ziehen zum Verschieben`}>
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
      {props.admin && showPhoto && cur && place[cur] && <div className="ds-admin">
        <b>Admin: Lage für dieses Foto</b>
        <label>Maßstab <input type="range" min={0.4} max={2.5} step={0.02} value={adj?.s ?? 1} onChange={(e) => setAdj({ s: Number(e.target.value), rot: adj?.rot ?? 0 })} /></label>
        <label>Drehung <input type="range" min={-35} max={35} step={0.5} value={adj?.rot ?? 0} onChange={(e) => setAdj({ s: adj?.s ?? 1, rot: Number(e.target.value) })} /> {((tfOf(cur).rot ?? 0)).toFixed(1)}°</label>
        <div className="deco-row">
          <button type="button" className="btn sm" onClick={async () => {
            const t = tfOf(cur), c = place[cur], sp = spots[cur];
            // aktuelle Lage des Motivs wird zur Standard-Lage dieser Position auf diesem Foto
            const anchor: Anchor = [toX(c.x, t), toY(c.y, t), sp.w * t.s, t.rot ?? 0];
            const r = await fetch('/api/admin/bildanker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ src: props.photo, pos: cur, anchor }) });
            if (r.ok) { setLocalAnchor({ ...(localAnchor ?? {}), [cur]: anchor }); setAdj(null); const dp = defaultPlace(product, cur); if (dp) setPlace({ ...place, [cur]: dp }); }
            setSaved(r.ok ? 'Gespeichert – gilt ab sofort für dieses Foto.' : 'Fehler beim Speichern');
          }}>Lage speichern</button>
          {props.anchor?.[cur] && <button type="button" className="linkbtn" onClick={async () => { await fetch('/api/admin/bildanker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ src: props.photo, pos: cur, anchor: null }) }); setSaved('Entfernt – automatische Lage (neu laden).'); }}>Anker entfernen</button>}
          {saved && <span className="ok" style={{ fontSize: 13 }}>{saved}</span>}
        </div>
        <small className="muted">Motiv auf die richtige Stelle ziehen, Maßstab und Drehung anpassen, speichern. Gilt für {cur} auf diesem Foto.</small>
      </div>}
      <p className="ds-note">Vorschau zur Orientierung – Motiv ziehen zum Verschieben. Vor der Produktion erhalten Sie eine exakte Vorschau zur Freigabe.</p>
    </div>
  );
}
