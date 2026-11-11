'use client';
import { Fragment, useMemo, useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { eur } from '@/lib/format';
import Gallery from '@/components/Gallery';
import { useCart } from '@/components/CartContext';
import { swatchBg } from '@/lib/colors';
import { WishButton } from '@/components/Wishlist';
import Info from '@/components/Info';
import Stars from '@/components/Stars';
import { FONTS, METHODS, MOTIFS, POSITIONS, PREVIEW, TEXT_COLORS, colorHex, fontCss, isImage, type Deco, type Motif } from '@/lib/deco';
import { nextTier, unitFor } from '@/lib/tiers';

type Logo = { id: string; name: string };

export default function AddToCart({ p, customerLogo, delivery }: { p: PublicProduct; customerLogo?: Logo | null; delivery?: string }) {
  const { addMany } = useCart();
  const [color, setColor] = useState(p.colors[0]);
  // Mengen je Farbe + Größe ("Black|M" -> 5) – mehrere Farben in einem Schritt möglich
  const [qty, setQty] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState('');

  // Veredelung
  const [decoOn, setDecoOn] = useState(false);
  const [method, setMethod] = useState(METHODS[0]);
  const [positions, setPositions] = useState<string[]>(['Brust links']);
  const [logo, setLogo] = useState<Logo | null>(customerLogo ?? null);
  const [uploading, setUploading] = useState(false);
  const [upErr, setUpErr] = useState('');
  const [note, setNote] = useState('');
  const [motif, setMotif] = useState<Motif>('logo');
  const [text, setText] = useState('');
  const [font, setFont] = useState(FONTS[0].id);
  const [tColor, setTColor] = useState('Weiß');
  const useLogo = motif !== 'text', useText = motif !== 'logo';

  const sizes = p.sizes.length ? p.sizes : [''];
  const cname = color?.name ?? '';
  const k = (c: string, s: string) => `${c}|${s}`;
  const setQ = (s: string, v: number) => setQty((q) => ({ ...q, [k(cname, s)]: Math.max(0, Math.min(99999, Math.floor(v) || 0)) }));
  const entries = Object.entries(qty).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const colorTotals = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [key, v] of entries) { const c = key.split('|')[0]; m[c] = (m[c] ?? 0) + v; }
    return m;
  }, [qty]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePos = (x: string) => setPositions((ps) => (ps.includes(x) ? ps.filter((y) => y !== x) : [...ps, x]));
  const decoOk = !decoOn || (positions.length > 0 && (!useText || !!text.trim()) && (!useLogo || method === 'Beratung gewünscht' || !!logo));

  async function upload(file?: File | null) {
    if (!file) return;
    setUploading(true); setUpErr('');
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await r.json().catch(() => ({}));
    setUploading(false);
    if (r.ok) setLogo({ id: d.id, name: d.name }); else setUpErr(d.error ?? 'Upload fehlgeschlagen.');
  }

  const onAdd = () => {
    const deco: Deco | null = decoOn ? { method, positions, motif, logoId: useLogo ? logo?.id ?? null : null, logoName: useLogo ? logo?.name ?? null : null, text: useText ? text.trim() : null, font: useText ? font : null, textColor: useText ? tColor : null, note: note.trim() } : null;
    const items = entries.map(([key, n]) => {
      const [c, s] = key.split('|');
      const col = p.colors.find((x) => x.name === c);
      return { id: p.id, sku: p.sku, name: p.name, color: c || undefined, hex: col?.hex, size: s || undefined, qty: n, price: p.price, category: p.category, image: p.images[0], deco, tiers: p.tiers, sizes: p.sizes };
    });
    addMany(items);
    setMsg(`${total} Stück von ${p.name} im Warenkorb${deco ? ' (mit Veredelung)' : ''}.`);
    setQty({});
  };
  const specs = Object.entries(p.specs ?? {}).filter(([, v]) => v && v !== 'Keine Angabe');
  const showLogo = decoOn && useLogo && logo && isImage(logo.name);
  const showText = decoOn && useText && !!text.trim();
  const showPreview = showLogo || showText;
  const prevPos = positions.filter((x) => PREVIEW[x]);
  const textStyle = { fontFamily: fontCss(font), color: colorHex(tColor) };

  return (
    <div className="pd">
      <div>
        <Gallery key={cname} p={color?.images?.length ? { ...p, images: color.images } : p} hex={color?.hex} overlay={showPreview ? <>
          {prevPos.map((x) => {
            const [l, t, w] = PREVIEW[x];
            return (
              <div key={x} className="deco-prev" style={{ left: `${l}%`, top: `${t}%`, width: `${w}%` }}>
                {showLogo && <img src={`/api/upload/${logo!.id}`} alt="" />}
                {showText && <span className="text-prev" style={{ ...textStyle, fontSize: `${w * 0.16}cqw` }}>{text}</span>}
              </div>
            );
          })}
          <div className="prev-note">Vorschau · Position und Größe unverbindlich</div>
        </> : null} />
      </div>
      <div>
        <div className="muted" style={{ textTransform: 'uppercase', fontSize: 13, letterSpacing: '.4px' }}>{p.brand} · Art.-Nr. {p.sku}</div>
        <h1 style={{ margin: '4px 0 0' }}>{p.name}</h1>
        {p.rating && <a href="#bewertungen" className="pd-rating"><Stars value={p.rating.avg} size={16} showValue count={p.rating.count} /></a>}
        {p.price != null ? <>
          <div className="price">{eur(p.price)} <span style={{ fontSize: 15, fontWeight: 500 }} className="muted">/ Stück</span></div>
          <div className="vat">netto zzgl. MwSt. ({eur(p.priceGross)} brutto) · schon ab 1 Stück{decoOn ? ' · Veredelung wird im Angebot kalkuliert' : ''}</div>
          {delivery && <div className="delivery"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1 4h14v12H1zM15 9h4l3 3v4h-7z" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>{delivery}</div>}
          {p.tiers.length > 0 && <div className="opt" style={{ marginTop: 14, marginBottom: 6 }}>Mengenrabatt <Info>Der Staffelpreis gilt für die Gesamtmenge dieses Artikels – alle Farben und Größen zusammen. Beispiel: 6× Schwarz M + 6× Rot L = 12 Stück.</Info></div>}
          {p.tiers.length > 0 && (
            <div className="tiers">
              <div className={`tier ${total < p.tiers[0].min ? 'on' : ''}`}><span>1–{p.tiers[0].min - 1} Stk.</span><b>{eur(p.price)}</b></div>
              {p.tiers.map((t, n) => {
                const to = p.tiers[n + 1]?.min;
                const on = total >= t.min && (!to || total < to);
                return <div key={t.min} className={`tier ${on ? 'on' : ''}`}><span>{to ? `${t.min}–${to - 1}` : `ab ${t.min}`} Stk.</span><b>{eur(t.price)}</b><small>−{Math.round((1 - t.price / p.price!) * 100)} %</small></div>;
              })}
            </div>
          )}
        </> : <>
          <div className="price" style={{ fontSize: 22, color: 'var(--brand)' }}>Preis auf Anfrage</div>
          <div className="vat">Schon ab 1 Stück · Ihren Preis erhalten Sie umgehend per E-Mail</div>
        </>}

        {p.colors.length > 0 && <>
          <div className="opt">Farbe: <span className="muted">{cname}</span> <span className="muted" style={{ fontWeight: 400 }}>({p.colors.length} Farben)</span></div>
          <div className="swatches">
            {p.colors.map((c) => (
              <button key={c.name} data-name={c.name} aria-label={c.name} className={`sw ${c.name === cname ? 'on' : ''}`} style={{ background: swatchBg(c) }} onClick={() => setColor(c)}>
                {colorTotals[c.name] ? <span className="sw-n">{colorTotals[c.name]}</span> : null}
              </button>
            ))}
          </div>
        </>}

        <div className="opt opt-row"><span>{sizes.length > 1 ? <>Größen & Mengen{p.colors.length > 0 && <span className="muted" style={{ fontWeight: 400 }}> für <span className="dot-inline" style={{ background: color ? swatchBg(color) : '#ddd' }} />{cname}</span>}</> : 'Menge'}</span>{p.sizeChart && <a href={p.sizeChart} target="_blank" rel="noreferrer" className="sizechart"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M2 8h20v8H2zM6 8v3M10 8v4M14 8v3M18 8v4" /></svg>Größentabelle</a>}</div>
        <div className={`szgrid ${sizes.length === 1 ? 'single' : ''}`}>
          {sizes.map((s) => {
            const v = qty[k(cname, s)] || 0;
            const st = p.stockBy ? p.stockBy[`${cname}|${s}`] : undefined;
            const out = st === 0;
            return (
              <div key={s} className={`sz ${v ? 'on' : ''} ${out ? 'out' : ''}`}>
                {s && <span className="sz-l">{s}</span>}
                <div className="step">
                  <button type="button" onClick={() => setQ(s, v - 1)} disabled={!v} aria-label={`${s} weniger`}>−</button>
                  <input type="number" inputMode="numeric" min={0} placeholder="0" value={v || ''} onChange={(e) => setQ(s, Number(e.target.value))} onFocus={(e) => e.target.select()} aria-label={`Menge ${s}`} />
                  <button type="button" onClick={() => setQ(s, v + 1)} aria-label={`${s} mehr`}>+</button>
                </div>
                {st != null && <span className={`stock ${out ? 'no' : st < 10 ? 'low' : 'ok'}`}>{out ? 'nicht vorrätig' : st < 10 ? `nur ${st} Stk.` : 'auf Lager'}</span>}
                {st != null && v > st && <span className="stock low">{out ? 'längere Lieferzeit' : `nur ${st} sofort`}</span>}
              </div>
            );
          })}
        </div>
        {p.colors.length > 1 && <p className="hint">Mehrere Farben? Oben eine andere Farbe wählen und Mengen eintragen – alles wird unten gesammelt.</p>}

        {/* Veredelung */}
        <label className="deco-toggle">
          <input type="checkbox" checked={decoOn} onChange={(e) => setDecoOn(e.target.checked)} />
          <span><strong>Veredeln mit Logo oder Text</strong> <span className="muted">– Druck oder Stick</span></span>
          <Info>Wir drucken oder besticken Ihr Logo bzw. Ihren Text. Die Kosten stehen als eigene Position im Angebot – vor der Produktion erhalten Sie eine Vorschau zur Freigabe.</Info>
        </label>
        {decoOn && (
          <div className="deco">
            <p className="hint" style={{ margin: '0 0 10px' }}>Unsicher, welches Verfahren passt? <a href="/druck-stick" target="_blank" className="alink">Druck & Stick im Vergleich</a></p>
            <div className="deco-row">
              {METHODS.map((m) => <button key={m} type="button" className={`size ${m === method ? 'on' : ''}`} onClick={() => setMethod(m)}>{m}</button>)}
            </div>
            <div className="opt" style={{ marginTop: 14 }}>Position(en)</div>
            <div className="deco-row">
              {POSITIONS.map((x) => <button key={x} type="button" className={`size ${positions.includes(x) ? 'on' : ''}`} onClick={() => togglePos(x)}>{x}</button>)}
            </div>
            <div className="opt" style={{ marginTop: 14 }}>Motiv</div>
            <div className="deco-row">
              {MOTIFS.map((m) => <button key={m.id} type="button" className={`size ${m.id === motif ? 'on' : ''}`} onClick={() => setMotif(m.id)}>{m.label}</button>)}
            </div>
            {useText && <>
              <div className="opt" style={{ marginTop: 14 }}>Text</div>
              <textarea className="deco-text" rows={2} maxLength={120} value={text} onChange={(e) => setText(e.target.value)} placeholder={'z. B. Vereinsname, Slogan oder Webadresse\n(zweite Zeile möglich)'} />
              <div className="deco-row" style={{ marginTop: 8 }}>
                {FONTS.map((f) => <button key={f.id} type="button" className={`size ${f.id === font ? 'on' : ''}`} style={{ fontFamily: f.css }} onClick={() => setFont(f.id)}>{f.id}</button>)}
              </div>
              <div className="deco-row" style={{ marginTop: 8 }}>
                {TEXT_COLORS.map((c) => <button key={c.id} type="button" title={c.id} aria-label={`Textfarbe ${c.id}`} className={`sw tc ${c.id === tColor ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => setTColor(c.id)} />)}
                <span className="muted" style={{ fontSize: 13 }}>{tColor}</span>
              </div>
              {text.trim() && <div className="text-sample" style={{ background: color?.hex ?? '#e5e7eb' }}><span style={textStyle}>{text}</span></div>}
              <p className="hint">Unterschiedliche Namen oder Nummern je Teil? Einfach unten im Hinweisfeld auflisten, z. B. „M: Lisa 7, L: Tom 10“.</p>
            </>}
            {useLogo && <><div className="opt" style={{ marginTop: 14 }}>Logo</div>
            {logo ? (
              <div className="logo-file">
                {isImage(logo.name) ? <img src={`/api/upload/${logo.id}`} alt="" /> : <span className="file-ico">{logo.name.split('.').pop()?.toUpperCase()}</span>}
                <span>{logo.name}{customerLogo && logo.id === customerLogo.id && <span className="muted"> · hinterlegt</span>}</span>
                <button type="button" className="linkbtn" onClick={() => setLogo(null)}>ändern</button>
              </div>
            ) : (
              <div className="deco-row">
                <label className="btn alt upl">
                  {uploading ? 'Lädt hoch …' : 'Logo hochladen'}
                  <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.ai,.eps" hidden onChange={(e) => upload(e.target.files?.[0])} />
                </label>
                {customerLogo && <button type="button" className="linkbtn" onClick={() => setLogo(customerLogo)}>Hinterlegtes Logo verwenden</button>}
              </div>
            )}
            {upErr && <p className="err" style={{ margin: '6px 0 0', fontSize: 14 }}>{upErr}</p>}
            <p className="hint">PNG, JPG, SVG, PDF, AI oder EPS bis 15 MB. Vektordateien liefern das beste Ergebnis.</p>
            </>}
            <textarea className="deco-note" placeholder="Hinweise, z. B. Größe ca. 8 cm, Pantone-Farben, Namen/Nummern je Größe …" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        )}

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
                <div className="sel-sum"><span>{total} Stück × {eur(u)}</span><b>{eur(total * u)} <small>netto</small></b></div>
                {u < p.price && <div className="ok" style={{ fontSize: 13 }}>Staffelpreis aktiv – Sie sparen {eur((p.price - u) * total)}</div>}
                {nx && <div className="tier-prog"><div className="bar"><i style={{ width: `${Math.min(100, ((total - prev) / (nx.min - prev)) * 100)}%` }} /></div><span>Noch <b>{nx.min - total} Stück</b> bis {eur(nx.price)} pro Stück</span></div>}
              </div>;
            })()}
          </div>
        )}
        <div className="qtyrow">
          <button className="btn" disabled={!total || !decoOk} onClick={onAdd}>
            {!total ? (sizes.length > 1 ? 'Größe & Menge wählen' : 'Menge wählen') : !decoOk ? (useText && !text.trim() ? 'Text eingeben' : 'Logo / Position wählen') : `${total} Stück in den Warenkorb`}
          </button>
          <WishButton id={p.id} variant="full" />
        </div>
        <div className={`mbar ${total ? 'has' : ''}`}>
          <div className="mbar-info">{total ? <><b>{total} Stk.</b>{p.price != null && <span> · {eur(unitFor(p.tiers, total, p.price)! * total)} netto</span>}</> : <span className="muted">{p.price != null ? `ab ${eur(p.tiers.length ? p.tiers[p.tiers.length - 1].price : p.price)}` : 'Preis auf Anfrage'}</span>}</div>
          <button className="btn" disabled={!!total && !decoOk} onClick={() => (total ? onAdd() : document.querySelector('.szgrid')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))}>
            {!total ? 'Größe wählen' : !decoOk ? 'Veredelung prüfen' : 'In den Warenkorb'}
          </button>
        </div>
        {msg && <div className="note ok">✓ {msg} <a href="/warenkorb" style={{ textDecoration: 'underline' }}>Zum Warenkorb</a></div>}

        {p.features?.length ? <ul className="feat">{p.features.map((f) => <li key={f}>{f}</li>)}</ul> : <p style={{ marginTop: 20 }}>{p.description}</p>}
        <dl className="specs">
          {p.material && <><dt>Material</dt><dd>{p.material}</dd></>}
          {p.composition && <><dt>Zusammensetzung</dt><dd>{p.composition}</dd></>}
          {p.gender && <><dt>Schnitt</dt><dd>{p.gender}</dd></>}
          {p.sizes.length > 0 && <><dt>Größen</dt><dd>{p.sizes.join(', ')}</dd></>}
          {specs.map(([key, v]) => <Fragment key={key}><dt>{key}</dt><dd>{v}</dd></Fragment>)}
        </dl>
      </div>
    </div>
  );
}
