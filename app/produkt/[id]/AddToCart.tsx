'use client';
import { Fragment, useMemo, useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { eur } from '@/lib/format';
import Gallery from '@/components/Gallery';
import { useCart } from '@/components/CartContext';
import { swatchBg } from '@/lib/colors';
import { WishButton } from '@/components/Wishlist';
import { FONTS, METHODS, MOTIFS, POSITIONS, PREVIEW, TEXT_COLORS, colorHex, fontCss, isImage, type Deco, type Motif } from '@/lib/deco';
import { nextTier, unitFor } from '@/lib/tiers';

type Logo = { id: string; name: string };

export default function AddToCart({ p, customerLogo }: { p: PublicProduct; customerLogo?: Logo | null }) {
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
      return { id: p.id, sku: p.sku, name: p.name, color: c || undefined, hex: col?.hex, size: s || undefined, qty: n, price: p.price, category: p.category, image: p.images[0], deco, tiers: p.tiers };
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
        <Gallery p={p} hex={color?.hex} overlay={showPreview ? <>
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
        {p.price != null ? <>
          <div className="price">{eur(p.price)} <span style={{ fontSize: 15, fontWeight: 500 }} className="muted">/ Stück</span></div>
          <div className="vat">netto zzgl. MwSt. ({eur(p.priceGross)} brutto) · schon ab 1 Stück{decoOn ? ' · Veredelung wird im Angebot kalkuliert' : ''}</div>
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
              <button key={c.name} title={c.name} aria-label={c.name} className={`sw ${c.name === cname ? 'on' : ''}`} style={{ background: swatchBg(c) }} onClick={() => setColor(c)}>
                {colorTotals[c.name] ? <span className="sw-n">{colorTotals[c.name]}</span> : null}
              </button>
            ))}
          </div>
        </>}

        <div className="opt">{sizes.length > 1 ? <>Mengen je Größe <span className="muted" style={{ fontWeight: 400 }}>– für {cname || 'diese Farbe'}</span></> : 'Menge'}</div>
        <div className="matrix">
          {sizes.map((s) => (
            <label key={s} className={`mx ${qty[k(cname, s)] ? 'on' : ''}`}>
              {s && <span>{s}</span>}
              <input type="number" inputMode="numeric" min={0} placeholder="0" value={qty[k(cname, s)] || ''} onChange={(e) => setQ(s, Number(e.target.value))} aria-label={`Menge ${s}`} />
            </label>
          ))}
        </div>
        {p.colors.length > 1 && <p className="hint">Tipp: Farbe wechseln und weitere Mengen eintragen – alles landet zusammen im Warenkorb.</p>}

        {/* Veredelung */}
        <label className="deco-toggle">
          <input type="checkbox" checked={decoOn} onChange={(e) => setDecoOn(e.target.checked)} />
          <span><strong>Veredeln mit Logo oder Text</strong> <span className="muted">– Druck oder Stick</span></span>
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

        <div className="qtyrow">
          <button className="btn" disabled={!total || !decoOk} onClick={onAdd}>
            {!total ? 'Menge eintragen' : !decoOk ? (useText && !text.trim() ? 'Text eingeben' : 'Logo / Position wählen') : `${total} Stück in den Warenkorb`}
          </button>
          <WishButton id={p.id} variant="full" />
        </div>
        {total > 0 && p.price != null && (() => {
          const u = unitFor(p.tiers, total, p.price)!;
          const nx = nextTier(p.tiers, total);
          return <div className="note">
            <strong>{total} Stück × {eur(u)} = {eur(total * u)} netto</strong>{u < p.price && <span className="ok"> · Sie sparen {eur((p.price - u) * total)}</span>}
            {nx && <div className="muted" style={{ fontSize: 13 }}>Noch {nx.min - total} Stück bis {eur(nx.price)} pro Stück</div>}
          </div>;
        })()}
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
