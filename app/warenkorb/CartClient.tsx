'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import ProductImage from '@/components/ProductImage';
import { eur } from '@/lib/format';
import { decoLabel } from '@/lib/deco';
import { unitFor } from '@/lib/tiers';
import { saveMyInquiry } from '@/lib/mine';
import { fmtDate, leadCheck } from '@/lib/leadtime';
import { productPath } from '@/lib/format';
import { usePrice } from '@/components/PriceMode';

const FORM_KEY = 'et-form-v1';
const FIELDS = ['name', 'company', 'email', 'phone', 'street', 'city'] as const;

export default function CartClient({ share, contact, remind }: { share: string | null; contact?: ReactNode; remind?: boolean }) {
  const { lines, setQty, update, remove, clear, decoToAll, addMany } = useCart();
  const pr = usePrice();
  const router = useRouter();
  const [more, setMore] = useState(false);
  // Warenkorb-Erinnerung (Opt-in): beim Anhaken, beim Verlassen der E-Mail und beim Schließen der Seite speichern
  const [keep, setKeep] = useState(false);
  const saveKeep = (beacon = false) => {
    const email = (document.getElementById('f-email') as HTMLInputElement | null)?.value.trim() ?? '';
    const name = (document.getElementById('f-name') as HTMLInputElement | null)?.value.trim() ?? '';
    if (!keep || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) || !lines.length) return;
    const body = JSON.stringify({ consent: true, email, name, lines: lines.map(({ id, color, size, qty, deco, sample, team }) => ({ id, color, size, qty, deco, sample, team })) });
    if (beacon && navigator.sendBeacon) navigator.sendBeacon('/api/warenkorb-erinnerung', new Blob([body], { type: 'application/json' }));
    else fetch('/api/warenkorb-erinnerung', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
  };
  useEffect(() => { if (keep) saveKeep(); }, [keep, lines]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = () => { if (document.visibilityState === 'hidden' && state !== 'sending') saveKeep(true); };
    document.addEventListener('visibilitychange', h); return () => document.removeEventListener('visibilitychange', h);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  // Warenkorb teilen
  const [shareUrl, setShareUrl] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const [incoming, setIncoming] = useState<{ lines: any[]; missing: number; err?: string } | null>(null);
  useEffect(() => {
    if (!share) return;
    fetch(`/api/warenkorb-teilen?id=${encodeURIComponent(share)}`).then((r) => r.json()).then((d) => setIncoming(d.ok ? { lines: d.lines, missing: d.missing } : { lines: [], missing: 0, err: d.error ?? 'Link ungültig.' })).catch(() => setIncoming({ lines: [], missing: 0, err: 'Link konnte nicht geladen werden.' }));
  }, [share]);
  const takeShared = (replace: boolean) => {
    if (!incoming) return;
    addMany(incoming.lines, { replace, quiet: true }); setIncoming(null); router.replace('/warenkorb');
  };
  async function doShare() {
    setShareMsg('');
    const r = await fetch('/api/warenkorb-teilen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lines: lines.map(({ id, color, size, qty, deco, sample, team }) => ({ id, color, size, qty, deco, sample, team })) }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setShareMsg(d.error ?? 'Teilen fehlgeschlagen.'); return; }
    const url = `${location.origin}/warenkorb?teilen=${d.id}`;
    setShareUrl(url);
    try {
      if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) { await navigator.share({ title: 'Warenkorb euro-trade', text: 'Bitte einmal prüfen:', url }); return; }
      await navigator.clipboard.writeText(url); setShareMsg('Link kopiert – z. B. an Vorstand oder Kollegen schicken.');
    } catch { setShareMsg('Link unten kopieren und weitergeben.'); }
  }
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
    if (r.ok) { if (d.token) saveMyInquiry(d.no, d.token); setNo(d.no ?? ''); clear(); if (d.token) { router.push(`/angebot/${d.token}?neu=1`); setState('sending'); } else setState('done'); } else { setState('error'); setErr(d.error ?? 'Senden fehlgeschlagen.'); }
  }

  const shareBanner = incoming && (
    <div className="box share-in" role="status">
      {incoming.err ? <span className="err">{incoming.err}</span> : <>
        <b>Geteilter Warenkorb mit {incoming.lines.length} {incoming.lines.length === 1 ? 'Position' : 'Positionen'}</b>{incoming.missing > 0 && <span className="muted"> ({incoming.missing} Artikel nicht mehr verfügbar)</span>}
        <div className="deco-row" style={{ marginTop: 8 }}>
          <button type="button" className="btn sm" onClick={() => takeShared(true)}>{lines.length ? 'Meinen Warenkorb ersetzen' : 'Übernehmen'}</button>
          {lines.length > 0 && <button type="button" className="btn alt sm" onClick={() => takeShared(false)}>Zu meinem Warenkorb hinzufügen</button>}
          <button type="button" className="linkbtn" onClick={() => { setIncoming(null); router.replace('/warenkorb'); }}>Ignorieren</button>
        </div>
      </>}
    </div>
  );

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

  if (!lines.length) return (<>
    {shareBanner}
    <div className="box" style={{ maxWidth: 640, margin: '20px auto', textAlign: 'center' }}>
      <h1>Ihr Warenkorb ist leer</h1>
      <p className="muted">Nutzen Sie die Suche oben – Tippfehler sind kein Problem.</p>
      <Link className="alink" href="/konto">Meine bisherigen Anfragen</Link>
    </div>
  </>);

  return (
    <>
      {shareBanner}
      <div className="cart-head"><h1>Warenkorb & Anfrage</h1><button type="button" className="btn alt sm" onClick={doShare}>🔗 Warenkorb teilen</button></div>
      {(shareMsg || shareUrl) && <div className="note share-out">{shareMsg}{shareUrl && <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} aria-label="Link zum Warenkorb" />}</div>}
      <div className="cart">
        <div className="box">
          {lines.map((l) => (
            <div className="line cline" key={l.key}>
              <div style={{ width: 64, height: 64 }}><ProductImage p={{ name: l.name, images: l.image ? [l.image] : [], colors: [{ name: l.color ?? '', hex: l.hex }], category: l.category }} /></div>
              <div style={{ minWidth: 0 }}>
                <Link href={`${productPath(l)}${l.team ? `?team=${l.team}` : ''}`} style={{ fontWeight: 600 }}>{l.name}</Link>{l.sample && <span className="sample-tag">Muster</span>}
                <div className="muted cl-meta">
                  {l.color && <span>{l.color}</span>}
                  {l.sizes && l.sizes.length > 1
                    ? <select value={l.size ?? ''} onChange={(e) => update(l.key, { size: e.target.value })} aria-label="Größe ändern">{l.sizes.map((s) => <option key={s}>{s}</option>)}</select>
                    : l.size && <span>{l.size}</span>}
                  {l.price != null && <span>{pr.p(unit(l))}/Stk.{unit(l)! < l.price && <span className="ok"> (Staffel)</span>}</span>}
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
                <strong>{l.price != null ? pr.pq(unit(l)!, l.qty) : '—'}</strong>
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
          {pct > 0 && <div className="tot"><span className="ok">Willkommensrabatt {pct} %</span><span className="ok">−{pr.p(Math.round(net * pct) / 100)}</span></div>}
          {codeInfo?.ok && pct === 0 && nextT && <div className="note muted" style={{ marginTop: 6 }}>Code gültig – ab {eur(nextT.min)} Warenwert erhalten Sie {nextT.pct} % Rabatt.</div>}
          {codeInfo?.ok && pct > 0 && nextT && <div className="note muted" style={{ marginTop: 2 }}>Noch {eur(nextT.min - net)} bis {nextT.pct} % Rabatt.</div>}
          {net > 0 && <div className="tot big"><span>Summe {pr.label} (Richtwert){anyOpen ? ' *' : ''}</span><span>{eur(lines.reduce((s, l) => s + pr.cq(unit(l) ?? 0, l.qty), 0) * (1 - pct / 100))}</span></div>}
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 0' }}>Endpreis inkl. Versand und ggf. Veredelung erhalten Sie mit dem Angebot.</p>
        </div>

        <form className="box form" onSubmit={submit}>
          <strong style={{ fontSize: 17 }}>Unverbindliches Angebot anfordern</strong>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: 13.5 }}>Nur Name und E-Mail nötig – alles Weitere klären wir mit dem Angebot.</p>
          <div className="two">
            <div><label htmlFor="f-name">Name *</label><input id="f-name" name="name" required defaultValue={form.name} key={`n${form.name}`} autoComplete="name" /></div>
            <div><label htmlFor="f-email">E-Mail *</label><input id="f-email" name="email" type="email" required defaultValue={form.email} key={`e${form.email}`} autoComplete="email" onBlur={() => saveKeep()} /></div>
          </div>
          {remind && <label className="ds-check keep"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> <span>Warenkorb merken und mich einmalig per E-Mail erinnern, falls ich heute nicht absende <span className="muted">(jederzeit abbestellbar)</span></span></label>}
          <label htmlFor="f-msg">Nachricht <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <textarea id="f-msg" name="message" placeholder="Fragen, Namen/Nummern, Wünsche …" />
          <button type="button" className="linkbtn more-toggle" aria-expanded={more} onClick={() => setMore(!more)}>{more ? '− Weniger Angaben' : '+ Firma, Telefon, Adresse, Wunschtermin (optional)'}</button>
          <div hidden={!more}>
          <div className="two">
            <div><label htmlFor="f-company">Firma / Verein</label><input id="f-company" name="company" defaultValue={form.company} key={`c${form.company}`} autoComplete="organization" /></div>
            <div><label htmlFor="f-phone">Telefon</label><input id="f-phone" name="phone" type="tel" defaultValue={form.phone} key={`p${form.phone}`} autoComplete="tel" /></div>
          </div>
          <label htmlFor="f-street">Straße und Nr. <span className="muted" style={{ fontWeight: 400 }}>(für Lieferung und Rechnung)</span></label>
          <input id="f-street" name="street" defaultValue={form.street} key={`s${form.street}`} autoComplete="street-address" />
          <div className="two">
            <div><label htmlFor="f-city">PLZ / Ort</label><input id="f-city" name="city" defaultValue={form.city} key={`o${form.city}`} autoComplete="address-level2" /></div>
            <div><label htmlFor="f-date">Wunschliefertermin</label><input id="f-date" name="date" type="date" min={minDate} value={wish} onChange={(e) => setWish(e.target.value)} /></div>
          </div>
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
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Wird gesendet …' : 'Anfrage senden – kostenlos & unverbindlich'}</button>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>Wir verwenden Ihre Angaben nur zur Bearbeitung der Anfrage – siehe <Link href="/datenschutz" style={{ textDecoration: 'underline' }}>Datenschutz</Link>.</p>
          {state === 'error' && <div className="note err" role="alert">{err}</div>}
          {contact}
        </form>
      </div>
    </>
  );
}
