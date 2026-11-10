'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import ProductImage from '@/components/ProductImage';
import { eur } from '@/lib/format';
import { decoLabel } from '@/lib/deco';
import { unitFor } from '@/lib/tiers';

export default function CartPage() {
  const { lines, setQty, remove, clear } = useCart();
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');
  // Staffelpreis gilt für die Gesamtmenge je Artikel (alle Farben/Größen)
  const perProduct = lines.reduce<Record<string, number>>((m, l) => ({ ...m, [l.id]: (m[l.id] ?? 0) + l.qty }), {});
  const unit = (l: (typeof lines)[number]) => unitFor(l.tiers, perProduct[l.id], l.price);
  const net = lines.reduce((s, l) => s + (unit(l) ?? 0) * l.qty, 0);
  const anyOpen = lines.some((l) => l.price == null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = await fetch('/api/anfrage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: f, lines: lines.map(({ id, color, size, qty, deco }) => ({ id, color, size, qty, deco })) }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setState('done'); clear(); } else { setState('error'); setErr(d.error ?? 'Senden fehlgeschlagen.'); }
  }

  if (state === 'done') return (
    <div className="box" style={{ maxWidth: 640, margin: '20px auto', textAlign: 'center' }}>
      <h1>Vielen Dank für Ihre Anfrage!</h1>
      <p>Wir melden uns innerhalb von 24 Stunden mit Ihrem Angebot. Eine Bestätigung ist per E-Mail unterwegs.</p>
      <Link className="btn" href="/" style={{ display: 'inline-grid', placeItems: 'center' }}>Weiter stöbern</Link>
    </div>
  );

  if (!lines.length) return (
    <div className="box" style={{ maxWidth: 640, margin: '20px auto', textAlign: 'center' }}>
      <h1>Ihr Warenkorb ist leer</h1>
      <p className="muted">Nutzen Sie die Suche oben – Tippfehler sind kein Problem.</p>
    </div>
  );

  return (
    <>
      <h1>Warenkorb & Anfrage</h1>
      <div className="cart">
        <div className="box">
          {lines.map((l) => (
            <div className="line" key={l.key}>
              <div style={{ width: 64, height: 64 }}><ProductImage p={{ name: l.name, images: l.image ? [l.image] : [], colors: [{ name: l.color ?? '', hex: l.hex }], category: l.category }} /></div>
              <div>
                <Link href={`/produkt/${encodeURIComponent(l.id)}`} style={{ fontWeight: 600 }}>{l.name}</Link>
                <div className="muted" style={{ fontSize: 13 }}>{[l.color, l.size, l.sku].filter(Boolean).join(' · ')}{l.price != null && <> · {eur(unit(l))}/Stk.{unit(l)! < l.price && <span className="ok"> (Staffel)</span>}</>}</div>
                {l.deco && <div className="deco-tag">✦ {decoLabel(l.deco)}</div>}
              </div>
              <input className="qty" style={{ width: 80, height: 40 }} type="number" min={1} value={l.qty} onChange={(e) => setQty(l.key, Number(e.target.value) || 1)} aria-label="Menge" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>{l.price != null ? eur(unit(l)! * l.qty) : '—'}</strong>
                <button className="x" onClick={() => remove(l.key)} aria-label="Entfernen">×</button>
              </div>
            </div>
          ))}
          {net > 0 && <div className="tot big"><span>Summe netto (Richtwert){anyOpen ? ' *' : ''}</span><span>{eur(net)}</span></div>}
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 0' }}>Endpreis inkl. Versand und ggf. Veredelung erhalten Sie mit dem Angebot.</p>
        </div>

        <form className="box form" onSubmit={submit}>
          <strong style={{ fontSize: 17 }}>Unverbindliches Angebot anfordern</strong>
          <div className="two">
            <div><label>Name *</label><input name="name" required /></div>
            <div><label>Firma</label><input name="company" /></div>
          </div>
          <div className="two">
            <div><label>E-Mail *</label><input name="email" type="email" required /></div>
            <div><label>Telefon</label><input name="phone" type="tel" /></div>
          </div>
          <label>PLZ / Ort</label><input name="city" />
          <label>Nachricht</label>
          <textarea name="message" placeholder="Optional: Liefertermin, Lieferadresse, Fragen …" />
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
