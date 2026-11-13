'use client';
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { eur } from '@/lib/format';
import { usePrice } from '@/components/PriceMode';
import Gallery from '@/components/Gallery';
import { useCart } from '@/components/CartContext';
import { swatchBg } from '@/lib/colors';
import { WishButton } from '@/components/Wishlist';
import Info from '@/components/Info';
import Stars from '@/components/Stars';
import BrandLogo from '@/components/BrandLogo';
import { brandSlug, findBrand } from '@/lib/brands';
import { FONTS, positionsFor, TEXT_COLORS, TEAM_POS, colorHex, fontCss, isImage, parseTeamList, type Deco, type Motif, type TeamRow } from '@/lib/deco';
import { uploadPreviews } from '@/components/decoRender';
import DecoStudio, { defaultPlace, type FitT, type Place } from '@/components/DecoStudio';
import { cmFor, maxPlace, spotsFor } from '@/lib/deco-layout';
import { nextTier, unitFor } from '@/lib/tiers';
import { calcDeco, type DecoPricing } from '@/lib/deco-pricing';
import SizeAdvisor from '@/components/SizeAdvisor';
import SizeTable from '@/components/SizeTable';
import { canDistribute, distribute } from '@/lib/sizing';
import { productPath } from '@/lib/format';
import { KondBox } from '@/components/AdminKond';

type Logo = { id: string; name: string };

export type TeamCtx = { slug: string; name: string; logoId?: string | null; logoName?: string | null; method: string; positions: string[]; personalize: 'aus' | 'name' | 'nummer' | 'beides'; deadline?: string | null; open: boolean; /** Motiv-Shop: Auswahl der Motive */ motifs?: { id: string; name: string }[]; /** Festpreis inkl. Druck */ fixed?: boolean };
type PText = { headline: string; intro: string; highlights: string[]; idealFor: string };
type Pic = { src: string; label: string };
export default function AddToCart({ p, customerLogo, delivery, copy, pricing, fits, anchors, admin, team, pictos, gpsr, sizeTable }: { sizeTable?: { sizes: string[]; head?: string; rows: [string, string, (number | string)[]][]; note?: string; shape?: 'hoodie' | 'tshirt' } | null; gpsr?: { firma: string; adresse: string[]; kontakt: string[] } | null; pictos?: { features: Pic[]; care: Pic[] }; p: PublicProduct; fits?: Record<string, number[]>; anchors?: Record<string, Record<string, [number, number, number, number]>>; admin?: boolean; team?: TeamCtx | null; customerLogo?: Logo | null; delivery?: string; copy?: PText; pricing?: DecoPricing | null }) {
  const { addMany } = useCart();
  const pr = usePrice();
  const [color, setColor] = useState(p.colors[0]);
  // Mengen je Farbe + Größe ("Black|M" -> 5) – mehrere Farben in einem Schritt möglich
  const [qty, setQty] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState('');

  // Veredelung
  const [decoOn, setDecoOn] = useState(!!team);
  // Vorauswahl: Stick für Polos, Jacken, Hemden und Caps – sonst Druck
  const [method, setMethod] = useState(team?.method ?? (/polo|jacke|hemd|cap|mütze/i.test(p.category) ? 'Stick' : 'Druck'));
  const posList = useMemo(() => positionsFor(p), [p]);
  const [positions, setPositions] = useState<string[]>(() => { const t = (team?.positions ?? []).filter((x) => posList.includes(x)); return t.length ? t : [posList[0]]; });
  // Live-Vorschau: Lage je Position + aktive Position
  const [place, setPlace] = useState<Place>({});
  const [activePos, setActivePos] = useState<string | null>(posList[0]);
  const [showPhotos, setShowPhotos] = useState(false);
  useEffect(() => {
    setPlace((pl) => { const n = { ...pl }; for (const x of positions) if (!n[x]) { const d = defaultPlace(p, x); if (d) n[x] = d; } return n; });
    if (!activePos || !positions.includes(activePos)) setActivePos(positions[positions.length - 1] ?? null);
  }, [positions]); // eslint-disable-line react-hooks/exhaustive-deps
  const [logo, setLogo] = useState<Logo | null>(team?.logoId ? { id: team.logoId, name: team.logoName ?? 'Vereinslogo' } : customerLogo ?? null);
  // Motiv-Shop: Motiv füllt den Druckbereich maximal (je nach Seitenverhältnis des Motivs)
  const [aspect, setAspect] = useState<number | null>(null);
  useEffect(() => {
    if (!team?.motifs || !logo) { setAspect(null); return; }
    const im = new Image(); let off = false;
    im.onload = () => { if (off || !im.naturalWidth) return; const ar = im.naturalWidth / im.naturalHeight; setAspect(ar);
      setPlace((pl) => { const n = { ...pl }; for (const x of positions) { const m = maxPlace(p, x, ar); if (m) n[x] = m; } return n; }); };
    im.src = `/api/upload/${logo.id}`;
    return () => { off = true; };
  }, [logo?.id, positions.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  // Teamliste: Namen / Nummern je Teil
  const [teamOn, setTeamOn] = useState(!!team && team.personalize !== 'aus');
  const [teamWhat, setTeamWhat] = useState<'name' | 'nummer' | 'beides'>(team && team.personalize !== 'aus' ? team.personalize : 'beides');
  const [teamPos, setTeamPos] = useState<string>('Rücken');
  const [teamRaw, setTeamRaw] = useState('');
  const teamRows: TeamRow[] = useMemo(() => (teamOn ? parseTeamList(teamRaw, p.sizes) : []), [teamOn, teamRaw, p.sizes]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [upErr, setUpErr] = useState('');
  const [note, setNote] = useState('');
  const [motif, setMotif] = useState<Motif>('logo');
  const [text, setText] = useState('');
  const [font, setFont] = useState(FONTS[0].id);
  const [tColor, setTColor] = useState('Weiß');
  const useLogo = motif !== 'text', useText = motif !== 'logo';
  // Veredelung in 3 Schritten (Team-Shop: alles auf einmal, da Logo/Verfahren feststehen)
  const [dragOver, setDragOver] = useState(false);
  const [noteOn, setNoteOn] = useState(false);
  const [morePos, setMorePos] = useState(false);
  const [full, setFull] = useState(false);
  const [distN, setDistN] = useState('');
  const [distOpen, setDistOpen] = useState(false);

  const sizes = p.sizes.length ? p.sizes : [''];
  const eolC = (c: string) => p.eol?.colors[c];
  const fmtD = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('de-DE');
  const cname = color?.name ?? '';
  const k = (c: string, s: string) => `${c}|${s}`;
  const setQ = (s: string, v: number) => setQty((q) => ({ ...q, [k(cname, s)]: Math.max(0, Math.min(99999, Math.floor(v) || 0)) }));
  const entries = Object.entries(qty).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  // Größenaufpreise der gewählten Mengen (z. B. 3XL)
  const upSum = entries.reduce((s, [key, v]) => s + (p.sizeUp?.[key.split('|')[1]] ?? 0) * v, 0);
  const colorTotals = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [key, v] of entries) { const c = key.split('|')[0]; m[c] = (m[c] ?? 0) + v; }
    return m;
  }, [qty]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePos = (x: string) => { setPositions((ps) => (ps.includes(x) ? ps.filter((y) => y !== x) : [...ps, x])); if (!positions.includes(x)) setActivePos(x); };
  // Team-Shop: Vereinslogo liegt bei uns – Mitglied muss nichts hochladen
  const decoOk = !decoOn || !!team || (positions.length > 0 && (!useText || !!text.trim()));
  const teamClosed = !!team && !team.open;
  /** Gesamtmenge typisch auf Größen verteilen (aktuelle Farbe) */
  const doDistribute = () => {
    const d = distribute(Math.floor(Number(distN)) || 0, sizes); if (!d) return;
    setQty((q) => ({ ...Object.fromEntries(Object.entries(q).filter(([key]) => key.split('|')[0] !== cname)), ...Object.fromEntries(Object.entries(d).filter(([, n]) => n > 0).map(([s, n]) => [k(cname, s), n])) }));
  };

  async function upload(file?: File | null) {
    if (!file) return;
    setUploading(true); setUpErr('');
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await r.json().catch(() => ({}));
    setUploading(false);
    if (r.ok) { setLogo({ id: d.id, name: d.name }); setMotif((m) => (m === 'text' ? 'beides' : m)); } else setUpErr(d.error ?? 'Upload fehlgeschlagen.');
  }

  const onAdd = async () => {
    const kind = spotsFor(p).kind;
    const pl = Object.fromEntries(positions.filter((x) => place[x]).map((x) => [x, place[x]]));
    const sizes = Object.fromEntries(positions.filter((x) => place[x]).map((x) => [x, cmFor(kind, place[x].w)]));
    let deco: Deco | null = decoOn ? { method, positions, place: pl, sizes, motif, logoId: useLogo ? logo?.id ?? null : null, logoName: useLogo ? logo?.name ?? null : null, text: useText ? text.trim() : null, font: useText ? font : null, textColor: useText ? tColor : null, note: [useLogo && !logo ? 'Logo folgt per E-Mail' : '', note.trim()].filter(Boolean).join(' · ') } : null;
    setBusy(true);
    // Live-Vorschau als Bild an die Anfrage hängen (Freigabe im Angebot)
    if (deco && (studioProps.logoSrc || studioProps.text.trim())) {
      const previews = await uploadPreviews({ ...studioProps, product: p }).catch(() => []);
      if (previews.length) deco = { ...deco, previews };
    }
    // Teamliste auf die Größen der aktuellen Farbe verteilen; Einträge ohne Größe an die erste Position
    const own = entries.filter(([key]) => key.split('|')[0] === cname);
    const rowsFor = (s: string, first: boolean) => teamRows.filter((r) => (r.size ? r.size === s : first));
    const items = entries.map(([key, n]) => {
      const [c, s] = key.split('|');
      const col = p.colors.find((x) => x.name === c);
      const rows = deco && teamOn && c === cname ? rowsFor(s, own[0]?.[0] === key) : [];
      const d = deco && rows.length ? { ...deco, team: { rows, pos: teamPos, what: teamWhat } } : deco;
      return { id: p.id, sku: p.sku, name: p.name, color: c || undefined, hex: col?.hex, size: s || undefined, qty: n, price: p.price, ...(p.sizeUp ? { ups: p.sizeUp } : {}), category: p.category, image: col?.image ?? p.images[0], deco: d, tiers: p.tiers, sizes: p.sizes, ...(team ? { team: team.slug } : {}) };
    });
    addMany(items);
    setBusy(false);
    setMsg(`${total} Stück von ${p.name} im Warenkorb${deco ? ' (mit Veredelung)' : ''}.`);
    setQty({});
  };
  /** Teamliste → Mengen der aktuellen Farbe übernehmen */
  const takeTeamQty = () => {
    const by: Record<string, number> = {};
    for (const r of teamRows) if (r.size) by[r.size] = (by[r.size] ?? 0) + 1;
    setQty((q) => ({ ...Object.fromEntries(Object.entries(q).filter(([key]) => key.split('|')[0] !== cname)), ...Object.fromEntries(Object.entries(by).map(([s, n]) => [k(cname, s), n])) }));
  };
  const specs = Object.entries(p.specs ?? {}).filter(([, v]) => v && v !== 'Keine Angabe');
  const est = useMemo(() => {
    if (!pricing || !decoOn) return null;
    const kd = spotsFor(p).kind;
    const pos = positions.map((x) => ({ pos: x, cm: place[x] ? cmFor(kd, place[x].w) : 10 }));
    return calcDeco(pricing, method, pos, Math.max(1, total));
  }, [pricing, decoOn, positions, place, method, total, p]);
  const estBox = est && (
    <div className="deco-est">
      <div className="row"><span>Veredelung ({est.method}) ca.</span><b>{pr.p(est.perPiece)} / Stück</b></div>
      {est.setupTotal > 0 && <div className="row"><span>+ einmalig {pricing![est.method === 'Stick' ? 'stick' : 'druck'].setupLabel}</span><b>{pr.p(est.setupTotal)}</b></div>}
      <small>{total > 0 ? `bei ${total} Stück, ${est.lines.map((l) => `${l.pos} ca. ${l.cm} cm`).join(', ')} · ${pr.label} · ` : `Menge wählen – ab mehr Stück wird es günstiger · ${pr.label} · `}verbindlich im Angebot</small>
    </div>
  );
  const studioProps = { product: p, colorHex: color?.hex, photo: color?.image ?? null, fit: color?.image ? (fits?.[color.image] as FitT | undefined) ?? null : null, anchor: color?.image ? anchors?.[color.image] ?? null : null, admin, positions, active: activePos, setActive: setActivePos, place, setPlace, logoSrc: useLogo && logo && (isImage(logo.name) || logo.name.startsWith('Motiv: ')) ? `/api/upload/${logo.id}` : null, text: useText ? text : '', font, textColor: tColor, method, aspect };
  // Galerie: Fotos der gewählten Farbe, danach Detailfotos des Artikels
  // Farbbild(er) zuerst, danach alle allgemeinen Ansichten (Rücken, Seite, Detail, Model) – keine Bilder anderer Farben
  const otherColorImgs = new Set(p.colors.filter((c) => c !== color).flatMap((c) => [c.image, ...(c.images ?? [])]).filter(Boolean) as string[]);
  // Farbe ohne eigenes Foto (einfarbig): Hauptbild als Farbvorschau umfärben
  const tint = color && !color.images?.length && !color.image && p.colors.length > 1 && color.hex && !/[\/+]|melange|heather|camo|stripe|multi/i.test(color.name) ? { hex: color.hex, name: color.name } : undefined;
  // Alle Farben durchblätterbar: Fotos aller Farben in Farbreihenfolge, danach die allgemeinen Ansichten.
  // Farbwahl springt zum Foto der Farbe, Blättern auf ein Farbfoto wählt die Farbe aus.
  const colorImgs = (c: (typeof p.colors)[number]) => (c.images?.length ? c.images : c.image ? [c.image] : []);
  const gal = useMemo(() => {
    const own = new Map<string, string>();
    for (const c of p.colors) for (const x of colorImgs(c)) if (!own.has(x)) own.set(x, c.name);
    if (own.size < 2) return null;
    const images = [...own.keys(), ...p.images.filter((x) => !own.has(x))];
    return { images, own };
  }, [p]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstOf = (c?: { name: string }) => (gal && c ? Math.max(0, gal.images.findIndex((x) => gal.own.get(x) === c.name)) : 0);
  const [galIdx, setGalIdx] = useState(() => firstOf(color));
  useEffect(() => { if (gal && gal.own.get(gal.images[galIdx]) !== color?.name) { const f = gal.images.findIndex((x) => gal.own.get(x) === color?.name); if (f >= 0) setGalIdx(f); } }, [color?.name]); // eslint-disable-line react-hooks/exhaustive-deps
  const onGal = (i: number) => { setGalIdx(i); const cn = gal?.own.get(gal.images[i]); if (cn && cn !== color?.name) { const c = p.colors.find((x) => x.name === cn); if (c) setColor(c); } };
  const galP = gal ? { ...p, images: gal.images } : color?.images?.length ? { ...p, images: [...color.images, ...p.images.filter((x) => !color.images!.includes(x) && !otherColorImgs.has(x))] } : p;
  const galProps = gal ? { index: galIdx, onIndex: onGal } : {};
  const galKey = gal ? 'all' : cname;
  const textStyle = { fontFamily: fontCss(font), color: colorHex(tColor) };

  return (
    <div className="pd">
      <div>
        {decoOn && !showPhotos ? <>
          <div className="pd-studio">
            <DecoStudio {...studioProps} />
            <button type="button" className="linkbtn ds-photos" onClick={() => setShowPhotos(true)}>Produktfotos ansehen</button>
          </div>
          <div className="pd-gal-m"><Gallery key={galKey} p={galP} hex={color?.hex} tint={tint} {...galProps} /></div>
        </> : <>
          <Gallery key={galKey} p={galP} hex={color?.hex} tint={tint} {...galProps} />
          {decoOn && <button type="button" className="linkbtn ds-photos" onClick={() => setShowPhotos(false)}>← Zurück zur Live-Vorschau</button>}
        </>}
      </div>
      <div>
        <div className="pd-brand">{findBrand(p.brand) ? <a href={`/marken/${brandSlug(findBrand(p.brand)!)}`} title={`Alle Artikel von ${p.brand}`}><BrandLogo name={p.brand} h={30} /></a> : <span>{p.brand}</span>}<span className="muted">Art.-Nr. {p.sku}</span></div>
        <h1 style={{ margin: '4px 0 0' }}>{p.name}</h1>
        {p.rating && <a href="#bewertungen" className="pd-rating"><Stars value={p.rating.avg} size={16} showValue count={p.rating.count} /></a>}
        {p.locked ? (
          <div className="locked-box">
            <b>🔒 Preise und Bestellung nach Anmeldung</b>
            <p>Unser Shop ist exklusiv für Vereine, Unternehmen und Partner. Mit Ihrem persönlichen Zugangscode sehen Sie Ihre Konditionen, Staffelpreise und können direkt anfragen.</p>
            <div className="deco-row"><a className="btn" href={`/zugang?weiter=${productPath(p)}`} style={{ display: 'inline-grid', placeItems: 'center' }}>Anmelden</a><a className="btn alt" href="/#anfragen" style={{ display: 'inline-grid', placeItems: 'center' }}>Zugang anfragen</a></div>
          </div>
        ) : p.price != null ? <>
          <div className="price">{p.was != null && <span className="price-was">{pr.p(p.was)}</span>}{pr.p(p.price)} <span style={{ fontSize: 15, fontWeight: 500 }} className="muted">/ Stück</span></div>
          <div className="vat">{pr.mode === 'brutto' ? <>inkl. MwSt. ({eur(p.price)} netto)</> : <>netto zzgl. MwSt. ({eur(p.priceGross)} brutto)</>} · schon ab 1 Stück{team?.fixed ? ' · Druck inklusive' : decoOn ? ' · Veredelung wird im Angebot kalkuliert' : ''}</div>
          {delivery && <div className="delivery"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1 4h14v12H1zM15 9h4l3 3v4h-7z" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>{delivery}</div>}
          {p.tiers.length > 0 && (
            <div className="tiers" aria-label="Staffelpreise">
              <span className="tiers-l">Staffel</span>
              {p.tiers.map((t, n) => {
                const to = p.tiers[n + 1]?.min;
                const on = total >= t.min && (!to || total < to);
                return <span key={t.min} className={`tier ${on ? 'on' : ''}`} title={`−${Math.round((1 - t.price / p.price!) * 100)} %`}>ab {t.min}: <b>{pr.p(t.price)}</b></span>;
              })}
              <Info>Der Staffelpreis gilt für die Gesamtmenge dieses Artikels – alle Farben und Größen zusammen. Beispiel: 6× Schwarz M + 6× Rot L = 12 Stück.</Info>
            </div>
          )}
        </> : <>
          <div className="price" style={{ fontSize: 22, color: 'var(--brand)' }}>Preis auf Anfrage</div>
          <div className="vat">Schon ab 1 Stück · Ihren Preis erhalten Sie umgehend per E-Mail</div>
        </>}

        <KondBox id={p.id} />

        {p.eol?.all && <div className="eol-box">⏳ <b>Auslaufartikel</b> – lieferbar solange Vorrat{p.eol.date ? `, voraussichtlich bis ${fmtD(p.eol.date)}` : ''}. Für Nachbestellungen später fragen Sie uns gern nach einem Nachfolger.</div>}
        {!!pictos?.features.length && <ul className="picto-row" aria-label="Eigenschaften">
          {pictos.features.map((x) => <li key={x.src}><img src={`/picto/${x.src}.png`} alt="" width={20} height={20} />{x.label}</li>)}
        </ul>}
        {p.colors.length > 0 && <>
          <div className="opt">Farbe: <span className="muted">{cname}</span> {p.colors.length > 1 && <span className="muted" style={{ fontWeight: 400 }}>({p.colors.length} Farben)</span>}</div>
          <div className="swatches">
            {p.colors.map((c) => (
              <button key={c.name} data-name={c.name} aria-label={`Farbe ${c.name}`} aria-pressed={c.name === cname} title={eolC(c.name) && !eolC(c.name)!.sizes ? `${c.name} – läuft aus` : c.name} className={`sw ${c.name === cname ? 'on' : ''} ${!p.eol?.all && eolC(c.name) && !eolC(c.name)!.sizes ? 'eol' : ''}`} style={{ background: swatchBg(c) }} onClick={() => setColor(c)}>
                {colorTotals[c.name] ? <span className="sw-n">{colorTotals[c.name]}</span> : null}
              </button>
            ))}
          </div>
          {!p.eol?.all && eolC(cname) && <p className="hint eol-hint">⏳ {cname}{eolC(cname)!.sizes ? ` in ${eolC(cname)!.sizes!.join(', ')}` : ''} läuft aus – lieferbar solange Vorrat{eolC(cname)!.date ? ` (voraussichtlich bis ${fmtD(eolC(cname)!.date!)})` : ''}.</p>}
        </>}

        <div className="opt opt-row"><span>{sizes.length > 1 ? <>Größen & Mengen{p.colors.length > 0 && <span className="muted" style={{ fontWeight: 400 }}> für <span className="dot-inline" style={{ background: color ? swatchBg(color) : '#ddd' }} />{cname}</span>}</> : 'Menge'}</span>{sizeTable && <SizeTable t={sizeTable} name={p.name} sku={p.sku} brand={p.brand} />}{!p.locked && <SizeAdvisor name={p.name} gender={p.gender} sizes={p.sizes} extra={`${p.description ?? ''} ${(p.features ?? []).join(' ')}`} chart={undefined} onPick={(s) => { setQ(s, Math.max(1, qty[k(cname, s)] || 0)); setTimeout(() => (document.querySelector(`[aria-label="Menge ${s}"]`) as HTMLInputElement | null)?.focus(), 50); }} />}</div>
        {p.locked ? (
          <>
            <div className="sizes-ro">{p.sizes.map((x) => <span key={x}>{x}</span>)}</div>
            <div className="qtyrow"><WishButton id={p.id} variant="full" /></div>
          </>
        ) : <>
        <div className={`szgrid ${sizes.length === 1 ? 'single' : ''}`}>
          {sizes.map((s) => {
            const v = qty[k(cname, s)] || 0;
            const st = p.stockBy ? p.stockBy[`${cname}|${s}`] : undefined;
            const out = st === 0;
            return (
              <div key={s} className={`sz ${v ? 'on' : ''} ${out ? 'out' : ''}`}>
                {s && <span className="sz-l">{s}{p.sizeUp?.[s] ? <small className="sz-up">+{pr.p(p.sizeUp[s])}</small> : null}</span>}
                <div className="step">
                  <button type="button" onClick={() => setQ(s, v - 1)} disabled={!v} aria-label={`${s} weniger`}>−</button>
                  <input type="number" inputMode="numeric" min={0} placeholder="0" value={v || ''} onChange={(e) => setQ(s, Number(e.target.value))} onFocus={(e) => e.target.select()} aria-label={`Menge ${s}`} />
                  <button type="button" onClick={() => setQ(s, v + 1)} aria-label={`${s} mehr`}>+</button>
                </div>
                {st == null && !p.eol?.all && eolC(cname)?.sizes?.includes(s) && <span className="stock low">läuft aus</span>}
                {st != null && <span className={`stock ${out ? 'no' : st < 10 ? 'low' : 'ok'}`}>{out ? 'nicht vorrätig' : st < 10 ? `nur ${st} Stk.` : 'auf Lager'}</span>}
                {st != null && v > st && <span className="stock low">{out ? 'längere Lieferzeit' : `nur ${st} sofort`}</span>}
              </div>
            );
          })}
        </div>
        {(canDistribute(sizes) || p.colors.length > 1) && <div className="sz-tools">
          {canDistribute(sizes) && !distOpen && <button type="button" className="sz-link" onClick={() => setDistOpen(true)}>Gesamtmenge auf Größen verteilen</button>}
          {p.colors.length > 1 && total > 0 && <span className="muted">Weitere Farbe? Oben wählen – alles wird gesammelt.</span>}
        </div>}
        {canDistribute(sizes) && distOpen && <div className="distrib">
          <label htmlFor="dist-n">Gesamtmenge</label>
          <input id="dist-n" type="number" inputMode="numeric" min={2} autoFocus value={distN} onChange={(e) => setDistN(e.target.value)} placeholder="z. B. 50" onKeyDown={(e) => { if (e.key === 'Enter') doDistribute(); }} />
          <button type="button" className="btn alt sm" disabled={!(Number(distN) >= 2)} onClick={doDistribute}>auf Größen verteilen</button>
          <Info>Verteilt die Menge nach einer typischen Größenverteilung für Teams und Firmen (S 12 %, M 25 %, L 28 %, XL 20 %, XXL 9 % …). Danach einfach einzelne Größen anpassen.</Info>
        </div>}

        {/* Veredelung */}
        {team && !team.motifs && <div className="team-banner">
          {team.logoId && <img src={`/api/upload/${team.logoId}`} alt="" />}
          <div><b>Team-Shop {team.name}</b><span>{team.method} mit Vereinslogo · {positions.join(', ')}{team.deadline ? ` · Bestellschluss ${new Date(team.deadline).toLocaleDateString('de-DE')}` : ''}</span></div>
        </div>}
        {team?.motifs && <div className="motif-pick">
          <div className="motif-pick-h"><b>Ihr Motiv</b><span className="muted">{logo?.name.replace(/^Motiv: /, '')} · {team.method} {positions.join(', ')}{team.fixed ? ' · Druck im Preis enthalten' : ''}</span></div>
          <div className="motif-grid sm">{team.motifs.map((m) => (
            <button key={m.id} type="button" className={`motif ${logo?.id === m.id ? 'on' : ''}`} title={m.name} aria-pressed={logo?.id === m.id}
              onClick={() => { setLogo({ id: m.id, name: `Motiv: ${m.name}` }); try { const u = new URL(location.href); u.searchParams.set('motiv', m.id); history.replaceState(null, '', u); } catch {} }}>
              <img src={`/api/upload/${m.id}`} alt={m.name} loading="lazy" />
            </button>))}
          </div>
        </div>}
        {!team && <label className="deco-toggle">
          <input type="checkbox" checked={decoOn} onChange={(e) => setDecoOn(e.target.checked)} />
          <span><strong>Mit Ihrem Logo veredeln</strong> <span className="muted">– gedruckt oder gestickt</span></span>
          <Info>Wir drucken oder besticken Ihr Logo bzw. Ihren Text. Die Kosten stehen als eigene Position im Angebot – vor der Produktion erhalten Sie eine Vorschau zur Freigabe.</Info>
        </label>}
        {decoOn && (
          <div className="deco deco-simple">
            {!team && <>
            <div className="dq"><span className="dq-n">1</span><b>Ihr Logo</b></div>
            {logo ? (
              <div className="logo-file">
                {isImage(logo.name) ? <img src={`/api/upload/${logo.id}`} alt="" /> : <span className="file-ico">{logo.name.split('.').pop()?.toUpperCase()}</span>}
                <span>{logo.name}{customerLogo && logo.id === customerLogo.id && <span className="muted"> · hinterlegt</span>}</span>
                <button type="button" className="linkbtn" onClick={() => setLogo(null)}>ändern</button>
              </div>
            ) : (
              <label className={`drop ${dragOver ? 'over' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files?.[0]); }}>
                <b>{uploading ? 'Lädt hoch …' : 'Logo hochladen'}</b>
                <span>oder Datei hierher ziehen · PNG, JPG, SVG, PDF, AI, EPS</span>
                <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.ai,.eps" hidden onChange={(e) => upload(e.target.files?.[0])} />
              </label>
            )}
            {upErr && <p className="err" style={{ margin: '6px 0 0', fontSize: 14 }}>{upErr}</p>}
            <div className="dq-links">
              {!logo && customerLogo && <button type="button" className="linkbtn" onClick={() => setLogo(customerLogo)}>Hinterlegtes Logo verwenden</button>}
              {!logo && <span className="muted">Kein Logo zur Hand? Einfach weitermachen – Sie können es nach der Anfrage per E-Mail schicken.</span>}
              <button type="button" className="linkbtn" onClick={() => setMotif(useText ? 'logo' : logo ? 'beides' : 'text')}>{useText ? '− Text entfernen' : '+ Text hinzufügen (z. B. Vereinsname)'}</button>
            </div>
            {useText && <>
              <textarea className="deco-text" rows={2} maxLength={120} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Ihr Text, z. B. Vereinsname oder Webadresse'} aria-label="Text" />
              <div className="deco-row" style={{ marginTop: 8 }}>
                {FONTS.map((f) => <button key={f.id} type="button" className={`size ${f.id === font ? 'on' : ''}`} style={{ fontFamily: f.css }} onClick={() => setFont(f.id)}>{f.id}</button>)}
                {TEXT_COLORS.map((c) => <button key={c.id} type="button" title={c.id} aria-label={`Textfarbe ${c.id}`} className={`sw tc ${c.id === tColor ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => setTColor(c.id)} />)}
              </div>
            </>}

            <div className="dq"><span className="dq-n">2</span><b>Wo soll es hin?</b> <span className="muted" style={{ fontSize: 13 }}>– mehrere möglich</span></div>
            <div className="deco-row">
              {[...posList].sort((a, b) => { const r = (x: string) => { const i = ['Brust links', 'Brust mittig', 'Rücken'].indexOf(x); return i >= 0 ? i : 10 + posList.indexOf(x); }; return r(a) - r(b); }).filter((x, k) => morePos || k < 3 || positions.includes(x)).map((x) => <button key={x} type="button" className={`size ${positions.includes(x) ? 'on' : ''}`} onClick={() => togglePos(x)}>{x}</button>)}
              {!morePos && posList.length > 3 && <button type="button" className="linkbtn" onClick={() => setMorePos(true)}>weitere Positionen</button>}
            </div>

            <div className="dq"><span className="dq-n">3</span><b>Druck oder Stick?</b></div>
            <div className="mcards">
              <button type="button" className={`mcard ${method === 'Druck' ? 'on' : ''}`} onClick={() => setMethod('Druck')}><b>Druck</b><span>günstig, auch für große und farbige Motive</span></button>
              <button type="button" className={`mcard ${method === 'Stick' ? 'on' : ''}`} onClick={() => setMethod('Stick')}><b>Stick</b><span>hochwertig und langlebig, ideal für Polos, Jacken, Caps</span></button>
            </div>
            <button type="button" className={`linkbtn dq-help ${method === 'Beratung gewünscht' ? 'on' : ''}`} onClick={() => setMethod('Beratung gewünscht')}>{method === 'Beratung gewünscht' ? '✓ Wir beraten Sie zum passenden Verfahren' : 'Weiß nicht – bitte beraten'}</button>
            </>}

            <div className="deco-studio-m"><DecoStudio {...studioProps} compact /><button type="button" className="btn alt sm ds-full" onClick={() => setFull(true)}>⤢ Vorschau groß ansehen</button></div>
            {estBox}

            {(!team || team.personalize !== 'aus') && <div className="teamlist">
              {!team && <button type="button" className="linkbtn dq-more" onClick={() => setTeamOn(!teamOn)}>{teamOn ? '− Namen / Nummern entfernen' : '+ Namen oder Nummern je Teil'}</button>}
              {team && <div className="opt" style={{ marginTop: 0 }}>Ihr Name / Ihre Nummer</div>}
              {teamOn && <>
                {!team && <div className="deco-row" style={{ marginTop: 8 }}>
                  {(['beides', 'name', 'nummer'] as const).map((w) => <button key={w} type="button" className={`size ${teamWhat === w ? 'on' : ''}`} onClick={() => setTeamWhat(w)}>{w === 'beides' ? 'Name + Nummer' : w === 'name' ? 'Nur Namen' : 'Nur Nummern'}</button>)}
                  <select value={teamPos} onChange={(e) => setTeamPos(e.target.value)} aria-label="Position">{TEAM_POS.map((x) => <option key={x}>{x}</option>)}</select>
                </div>}
                <textarea className="deco-note" rows={team ? 2 : 4} value={teamRaw} onChange={(e) => setTeamRaw(e.target.value)}
                  placeholder={team ? `z. B. ${teamWhat === 'nummer' ? '10 M' : teamWhat === 'name' ? 'Lisa M' : 'Lisa 10 M'}` : 'Eine Zeile pro Teil – direkt aus Excel einfügen:\nLisa\t7\tM\nTom\t10\tL\nMia\t3\tS'} />
                {teamRows.length > 0 && <div className="tl-table">
                  <div className="tl-head"><span>Name</span><span>Nr.</span><span>Größe</span></div>
                  {teamRows.slice(0, 40).map((r, n) => <div key={n} className={r.size ? '' : 'warn'}><span>{r.name || '–'}</span><span>{r.nr || '–'}</span><span>{r.size || 'fehlt'}</span></div>)}
                  {teamRows.length > 40 && <div className="muted">… und {teamRows.length - 40} weitere</div>}
                </div>}
                {teamRows.length > 0 && <div className="tl-foot">
                  <span>{teamRows.length} {teamRows.length === 1 ? 'Teil' : 'Teile'}{teamRows.some((r) => !r.size) ? ' · bei einigen fehlt die Größe' : ''}</span>
                  {teamRows.some((r) => r.size) && <button type="button" className="btn alt sm" onClick={takeTeamQty}>Mengen für {cname || 'diese Farbe'} übernehmen</button>}
                </div>}
              </>}
            </div>}
            {!team && !noteOn && !note ? <button type="button" className="linkbtn dq-more" onClick={() => setNoteOn(true)}>+ Hinweis an uns</button>
              : <textarea className="deco-note" placeholder="z. B. Pantone-Farben, besondere Wünsche …" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Hinweise zur Veredelung" />}
          </div>
        )}
        {full && <div className="ds-fs" role="dialog" aria-modal="true" aria-label="Vorschau groß">
          <div className="ds-fs-head"><b>Live-Vorschau</b><button type="button" className="btn sm" onClick={() => setFull(false)}>Fertig</button></div>
          <DecoStudio {...studioProps} />
        </div>}

        {total > 0 && (
          <div className="sel-box">
            <div className="sel-head"><strong>Ihre Auswahl</strong><button type="button" className="linkbtn" onClick={() => setQty({})}>alles zurücksetzen</button></div>
            {Object.entries(colorTotals).map(([cn, n]) => {
              const col = p.colors.find((x) => x.name === cn);
              const parts = sizes.filter((sz) => qty[k(cn, sz)]).map((sz) => `${sz ? sz + ' × ' : ''}${qty[k(cn, sz)]}`);
              return (
                <div key={cn || '-'} className={`sel-row ${cn === cname ? 'cur' : ''}`}>
                  {col && <span className="dot-inline big" style={{ background: swatchBg(col) }} />}
                  <div className="sel-main">
                    <b>{cn || p.name}</b>
                    <div className="sel-sizes">{parts.map((x) => <span key={x}>{x}</span>)}</div>
                  </div>
                  <span className="sel-n">{n} Stk.</span>
                  {col && cn !== cname && <button type="button" className="linkbtn" onClick={() => setColor(col)}>ändern</button>}
                  <button type="button" className="x" aria-label={`${cn} entfernen`} onClick={() => setQty((q) => Object.fromEntries(Object.entries(q).filter(([key]) => key.split('|')[0] !== cn)))}>×</button>
                </div>
              );
            })}
            {p.price != null && (() => {
              const u = unitFor(p.tiers, total, p.price)!;
              const nx = nextTier(p.tiers, total);
              const prev = [...p.tiers].reverse().find((t) => t.min <= total)?.min ?? 1;
              return <div className="sel-foot">
                <div className="sel-sum"><span>Textil: {total} Stück × {pr.p(u)}</span><b>{pr.pq(u, total)} <small>{pr.label}</small></b></div>
                {upSum > 0 && <div className="sel-sum sub"><span>Größenaufpreis</span><b>{pr.p(upSum)}</b></div>}
                {est && <div className="sel-sum sub"><span>Veredelung ca. {total} × {pr.p(est.perPiece)}</span><b>{pr.p(total * est.perPiece)}</b></div>}
                {est && est.setupTotal > 0 && <div className="sel-sum sub"><span>einmalig ({est.method})</span><b>{pr.p(est.setupTotal)}</b></div>}
                {est && <div className="sel-sum grand"><span>Gesamt ca.</span><b>{pr.p(total * u + upSum + total * est.perPiece + est.setupTotal)} <small>{pr.label}</small></b></div>}
                {u < p.price && <div className="ok" style={{ fontSize: 13 }}>Staffelpreis aktiv – Sie sparen {pr.p((p.price - u) * total)}</div>}
                {nx && <div className="tier-prog"><div className="bar"><i style={{ width: `${Math.min(100, ((total - prev) / (nx.min - prev)) * 100)}%` }} /></div><span>Noch <b>{nx.min - total} Stück</b> bis {pr.p(nx.price)} pro Stück</span></div>}
              </div>;
            })()}
          </div>
        )}
        <div className="qtyrow">
          <button className="btn" disabled={!total || !decoOk || busy || teamClosed} onClick={onAdd}>
            {teamClosed ? 'Bestellschluss erreicht' : busy ? 'Vorschau wird gespeichert …' : !total ? (sizes.length > 1 ? 'Größe & Menge wählen' : 'Menge wählen') : !decoOk ? (useText && !text.trim() ? 'Text eingeben' : 'Position wählen') : `${total} Stück in den Warenkorb`}
          </button>
          <WishButton id={p.id} variant="full" />
        </div>
        <div className={`mbar ${total ? 'has' : ''}`}>
          <div className="mbar-info">{total ? <><b>{total} Stk.</b>{p.price != null && <span> · {est ? 'ca. ' : ''}{pr.p(unitFor(p.tiers, total, p.price)! * total + upSum + (est ? est.perPiece * total + est.setupTotal : 0))} {pr.label}{est ? ' inkl. Veredelung' : ''}</span>}</> : <span className="muted">{p.price != null ? `${pr.p(p.price)} / Stück` : 'Preis auf Anfrage'}</span>}</div>
          <button className="btn" disabled={(!!total && !decoOk) || busy || teamClosed} onClick={() => (total ? onAdd() : document.querySelector('.szgrid')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))}>
            {!total ? 'Größe wählen' : !decoOk ? 'Veredelung prüfen' : 'In den Warenkorb'}
          </button>
        </div>
        </>}
        {msg && <div className="note ok">✓ {msg} <a href="/warenkorb" style={{ textDecoration: 'underline' }}>Zum Warenkorb</a></div>}

        {copy && (
          <div className="ptext">
            <h2>{copy.headline}</h2>
            {copy.intro.split(/\n\s*\n/).map((x) => <p key={x}>{x}</p>)}
            {copy.highlights.length > 0 && <ul className="hl">{copy.highlights.map((h) => <li key={h}>{h}</li>)}</ul>}
            {copy.idealFor && <div className="ideal"><span>Ideal für:</span>{copy.idealFor.split(',').map((x) => <b key={x}>{x.trim()}</b>)}</div>}
          </div>
        )}
        <details className="pdetails" open>
          <summary>Produktdetails & Material</summary>
          {p.features?.length ? <ul className="feat">{p.features.map((f) => <li key={f}>{f}</li>)}</ul> : <p style={{ marginTop: 12 }}>{p.description}</p>}
        <dl className="specs">
          {p.material && <><dt>Material</dt><dd>{p.material}</dd></>}
          {p.composition && <><dt>Zusammensetzung</dt><dd>{p.composition}</dd></>}
          {p.gender && <><dt>Schnitt</dt><dd>{p.gender}</dd></>}
          {p.sizes.length > 0 && <><dt>Größen</dt><dd>{p.sizes.join(', ')}</dd></>}
          {specs.map(([key, v]) => <Fragment key={key}><dt>{key}</dt><dd>{v}</dd></Fragment>)}
        </dl>
        {!!pictos?.care.length && <div className="care"><b>Pflegehinweise</b><ul>{pictos.care.map((x) => <li key={x.src}><img src={`/picto/${x.src}.png`} alt="" width={34} height={34} loading="lazy" /><span>{x.label}</span></li>)}</ul></div>}
        </details>
        <section className="gpsr" aria-labelledby="gpsr-h">
          <h3 id="gpsr-h">Hersteller & Produktsicherheit</h3>
          <dl>
            <dt>Produkt</dt><dd>{p.name} · {p.brand} · Art.-Nr. {p.sku}</dd>
            {gpsr && <><dt>Hersteller</dt><dd>{gpsr.firma}<br />{gpsr.adresse.join(', ')}{gpsr.kontakt.length > 0 && <><br />{gpsr.kontakt.map((k, n) => <span key={k}>{n > 0 && ' · '}{k.includes('@') ? <a className="alink" href={`mailto:${k}`}>{k}</a> : <a className="alink" href={k.startsWith('http') ? k : `https://${k}`} target="_blank" rel="noreferrer nofollow">{k.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>}</span>)}</>}</dd></>}
            <dt>Händler</dt><dd>Euro-Trade · Sebastian Hosbach, Seehang 28, 44263 Dortmund · <a className="alink" href="mailto:info@euro-trade.com">info@euro-trade.com</a> · <a className="alink" href="tel:+493040719258">030 40719258</a></dd>
            <dt>Sicherheit</dt><dd>Bitte die Pflege- und Gebrauchshinweise auf dem Etikett beachten. Fragen oder Hinweise zur Produktsicherheit: <a className="alink" href="/produktsicherheit">Produktsicherheit (GPSR)</a></dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
