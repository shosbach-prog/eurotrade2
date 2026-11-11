'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import ProductImage from '@/components/ProductImage';
import { eur } from '@/lib/format';
import { decoLabel } from '@/lib/deco';
import { unitFor } from '@/lib/tiers';
import { saveMyInquiry } from '@/lib/mine';
import { fmtDate, leadCheck } from '@/lib/leadtime';

const FORM_KEY = 'et-form-v1';
const FIELDS = ['name', 'company', 'email', 'phone', 'city'] as const;

export default function CartPage() {
  const { lines, setQty, update, remove, clear, decoToAll } = useCart();
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [no, setNo] = useState('');
  const [code, setCode] = useState('');
  const [wish, setWish] = useState('');
  const [codeInfo, setCodeInfo] = useState<{ ok: boolean; tiers: { pct: number; min: number }[] } | null>(null);
  async function checkCode() {
    if (!code.trim()) { setCodeInfo(null); return; }
    const d = await fetch(`/api/rabatt?code=${encodeURIComponent(code.trim())}`).then((r) => r.json()).catch(() => ({ ok: false, tiers: [] }));
    setCodeInfo(d);
  }

  // Formular vorausfüllen: zuletzt verwendete Daten + Kundenname aus dem Code
  useEffect(() => {
    let saved: Record<string, string> = {};
    try { saved = JSON.parse(localStorage.getItem(FORM_KEY) || '{}'); } catch {}
    setForm(saved);
    fetch('/api/ich').then((r) => r.json()).then((d) => { if (d.company) setForm((f) => ({ ...f, company: f.company || d.company })); }).catch(() => {});
  }, []);

  // Staffelpreis gilt für die Gesamtmenge je Artikel (alle Farben/Größen)
  const perProduct = lines.reduce<Record<string, number>>((m, l) => ({ ...m, [l.id]: (m[l.id] ?? 0) + l.qty }), {});
  const unit = (l: (typeof lines)[number]) => unitFor(l.tiers, perProduct[l.id], l.price);
  const net = lines.reduce((s, l) => s + (unit(l) ?? 0) * l.qty, 0);
  const anyOpen = lines.some((l) => l.price == null);
  // Vorschläge „gleiche Veredelung“: ohne Teamliste/Vorschaubilder vergleichen und übertragen
  const decos = [...new Map(lines.filter((l) => l.deco).map((l) => { const d = { ...l.deco!, team: null, previews: undefined }; return [JSON.stringify(d), d]; })).values()];
  const minDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  const pct = codeInfo?.ok ? [...codeInfo.tiers].reverse().find((t) => net >= t.min)?.pct ?? 0 : 0;
  const nextT = codeInfo?.ok ? codeInfo.tiers.find((t) => t.min > net) : undefined;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try { localStorage.setItem(FORM_KEY, JSON.stringify(Object.fromEntries(FIELDS.map((k) => [k, f[k] ?? ''])))); } catch {}
    const r = await fetch('/api/anfrage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: f, code: codeInfo?.ok ? code.trim() : '', team: lines.find((l) => l.team)?.team ?? '', lines: lines.map(({ id, color, size, qty, deco, sample }) => ({ id, color, size, qty, deco, sample })) }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { if (d.token) saveMyInquiry(d.no, d.token); setNo(d.no ?? ''); setState('done'); clear(); } else { setState('error'); setErr(d.error ?? 'Senden fehlgeschlagen.'); }
  }

  if (state === 'done') return (
    <div className="box" style={{ maxWidth: 640, margin: '20px auto', textAlign: 'center' }}>
      <h1>Vielen Dank für Ihre Anfrage!</h1>
      <p>Ihre Anfrage {no && <b>{no}</b>} ist eingegangen. Wir melden uns innerhalb von 24 Stunden mit Ihrem Angebot – eine Bestätigung ist per E-Mail unterwegs.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link className="btn" href="/konto" style={{ display: 'inline-grid', placeItems: 'center' }}>Meine Anfragen</Link>
        <Link className="btn alt" href="/" style={{ display: 'inline-grid', placeItems: 'center' }}>Weiter stöbern</Link>
      </div>
    </div>
  );

  if (!lines.length) return (
    <div className="box" style={{ maxWidth: 640, margin: '20px auto', textAlign: 'center' }}>
      <h1>Ihr Warenkorb ist leer</h1>
      <p className="muted">Nutzen Sie die Suche oben – Tippfehler sind kein Problem.</p>
      <Link className="alink" href="/konto">Meine bisherigen Anfragen</Link>
    </div>
  );

  return (
    <>
      <h1>Warenkorb & Anfrage</h1>
      <div className="cart">
        <div className="box">
          {lines.map((l) => (
            <div className="line cline" key={l.key}>
              <div style={{ width: 64, height: 64 }}><ProductImage p={{ name: l.name, images: l.image ? [l.image] : [], colors: [{ name: l.color ?? '', hex: l.hex }], category: l.category }} /></div>
              <div style={{ minWidth: 0 }}>
                <Link href={`/produkt/${encodeURIComponent(l.id)}${l.team ? `?team=${l.team}` : ''}`} style={{ fontWeight: 600 }}>{l.name}</Link>{l.sample && <span className="sample-tag">Muster</span>}
                <div className="muted cl-meta">
                  {l.color && <span>{l.color}</span>}
                  {l.sizes && l.sizes.length > 1
                    ? <select value={l.size ?? ''} onChange={(e) => update(l.key, { size: e.target.value })} aria-label="Größe ändern">{l.sizes.map((s) => <option key={s}>{s}</option>)}</select>
                    : l.size && <span>{l.size}</span>}
                  {l.price != null && <span>{eur(unit(l))}/Stk.{unit(l)! < l.price && <span className="ok"> (Staffel)</span>}</span>}
                </div>
                {l.deco && <div className="deco-tag">✦ {decoLabel(l.deco)} <button className="linkbtn" onClick={() => update(l.key, { deco: null })}>entfernen</button></div>}
                {l.deco?.team?.rows.length ? <div className="muted" style={{ fontSize: 12.5 }}>{l.deco.team.rows.map((r) => [r.name, r.nr && `#${r.nr}`].filter(Boolean).join(' ')).join(', ')}</div> : null}
                {l.deco?.previews?.length ? <div className="cl-prev">{l.deco.previews.map((id) => <img key={id} src={`/api/upload/${id}`} alt="Vorschau" />)}</div> : null}
              </div>
              {l.sample ? <div className="muted" style={{ width: 112, textAlign: 'center', fontSize: 13 }}>1 Stück</div> : <div className="step" style={{ width: 112 }}>
                <button type="button" onClick={() => (l.qty > 1 ? setQty(l.key, l.qty - 1) : remove(l.key))} aria-label="weniger">−</button>
                <input type="number" min={1} value={l.qty} onFocus={(e) => e.target.select()} onChange={(e) => setQty(l.key, Number(e.target.value) || 1)} aria-label="Menge" />
                <button type="button" onClick={() => setQty(l.key, l.qty + 1)} aria-label="mehr">+</button>
              </div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                <strong>{l.price != null ? eur(unit(l)! * l.qty) : '—'}</strong>
                <button className="x" onClick={() => remove(l.key)} aria-label="Entfernen">×</button>
              </div>
            </div>
          ))}
          {decos.length > 0 && lines.some((l) => (!l.deco && !l.sample) || decos.length > 1) && (
            <div className="deco-all">
              <span>✦ Gleiche Veredelung für alle Positionen?</span>
              {decos.map((d) => <button key={JSON.stringify(d)} className="btn alt" style={{ height: 36 }} onClick={() => decoToAll(d)}>{decos.length > 1 ? `„${decoLabel(d)}“ übernehmen` : 'Auf alle übertragen'}</button>)}
            </div>
          )}
          <div className="code-row">
            <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeInfo(null); }} onBlur={checkCode} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), checkCode())} placeholder="Rabattcode, z. B. ET-ABC123" aria-label="Rabattcode" />
            <button type="button" className="btn alt" onClick={checkCode}>Einlösen</button>
          </div>
          {codeInfo && !codeInfo.ok && <div className="note err" style={{ marginTop: 6 }}>Dieser Code ist ungültig oder wurde bereits eingelöst.</div>}
          {pct > 0 && <div className="tot"><span className="ok">Willkommensrabatt {pct} %</span><span className="ok">−{eur(Math.round(net * pct) / 100)}</span></div>}
          {codeInfo?.ok && pct === 0 && nextT && <div className="note muted" style={{ marginTop: 6 }}>Code gültig – ab {eur(nextT.min)} Warenwert erhalten Sie {nextT.pct} % Rabatt.</div>}
          {codeInfo?.ok && pct > 0 && nextT && <div className="note muted" style={{ marginTop: 2 }}>Noch {eur(nextT.min - net)} bis {nextT.pct} % Rabatt.</div>}
          {net > 0 && <div className="tot big"><span>Summe netto (Richtwert){anyOpen ? ' *' : ''}</span><span>{eur(net - Math.round(net * pct) / 100)}</span></div>}
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 0' }}>Endpreis inkl. Versand und ggf. Veredelung erhalten Sie mit dem Angebot.</p>
        </div>

        <form className="box form" onSubmit={submit}>
          <strong style={{ fontSize: 17 }}>Unverbindliches Angebot anfordern</strong>
          <div className="two">
            <div><label>Name *</label><input name="name" required defaultValue={form.name} key={`n${form.name}`} autoComplete="name" /></div>
            <div><label>Firma / Verein</label><input name="company" defaultValue={form.company} key={`c${form.company}`} autoComplete="organization" /></div>
          </div>
          <div className="two">
            <div><label>E-Mail *</label><input name="email" type="email" required defaultValue={form.email} key={`e${form.email}`} autoComplete="email" /></div>
            <div><label>Telefon</label><input name="phone" type="tel" defaultValue={form.phone} key={`p${form.phone}`} autoComplete="tel" /></div>
          </div>
          <div className="two">
            <div><label>PLZ / Ort</label><input name="city" defaultValue={form.city} key={`o${form.city}`} autoComplete="address-level2" /></div>
            <div><label>Wunschliefertermin</label><input name="date" type="date" min={minDate} value={wish} onChange={(e) => setWish(e.target.value)} /></div>
          </div>
          {(() => {
            const hasDeco = lines.some((l) => l.deco);
            const c = leadCheck(wish ? new Date(wish + 'T12:00:00') : null, hasDeco);
            return <div className={`lead lead-${c.state}`}>
              {c.state === 'offen' && <>Frühester Liefertermin: <b>{fmtDate(c.earliest)}</b>{hasDeco ? ' (mit Veredelung)' : ''} – Wunschtermin eintragen, wir prüfen ihn sofort.</>}
              {c.state === 'ok' && <>✓ Machbar – wenn Sie Angebot{hasDeco ? ' und Vorschau' : ''} bis <b>{fmtDate(c.latestApproval!)}</b> freigeben.</>}
              {c.state === 'knapp' && <>⚠ Knapp, aber möglich – Freigabe bitte spätestens <b>{fmtDate(c.latestApproval!)}</b>. Wir melden uns schnell.</>}
              {c.state === 'zu-spaet' && <>✗ Sehr knapp – regulär frühestens <b>{fmtDate(c.earliest)}</b>. Schreiben Sie uns trotzdem: Express ist oft möglich.</>}
            </div>;
          })()}
          <label>Nachricht</label>
          <textarea name="message" placeholder="Optional: Lieferadresse, Fragen, Namen/Nummern …" />
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}>
            <input type="checkbox" name="privacy" required style={{ width: 'auto' }} />
            <span>Ich stimme der Verarbeitung meiner Daten gemäß <Link href="/datenschutz" style={{ textDecoration: 'underline' }}>Datenschutzerklärung</Link> zu. *</span>
          </label>
          <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Wird gesendet …' : 'Anfrage senden'}</button>
          {state === 'error' && <div className="note err">{err}</div>}
        </form>
      </div>
    </>
  );
}
