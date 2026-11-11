'use client';
import { useState } from 'react';

type P = { id: string; name: string; sku: string };
type Entry = { rating: number; title: string; text: string };

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ['', 'Schlecht', 'Mäßig', 'Gut', 'Sehr gut', 'Hervorragend'];
  return (
    <div className="star-input" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n} Sterne`} className={(hover || value) >= n ? 'on' : ''} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}>★</button>
      ))}
      <span className="muted">{labels[hover || value]}</span>
    </div>
  );
}

export default function ReviewForm({ token, products, defaultName, company, done: done0 }: { token: string; products: P[]; defaultName: string; company: string; done: boolean }) {
  const [shop, setShop] = useState<Entry>({ rating: 0, title: '', text: '' });
  const [items, setItems] = useState<Record<string, Entry>>(Object.fromEntries(products.map((p) => [p.id, { rating: 0, title: '', text: '' }])));
  const [name, setName] = useState(defaultName);
  const [showCompany, setShowCompany] = useState(!!company);
  const [state, setState] = useState<'idle' | 'busy' | 'done'>(done0 ? 'done' : 'idle');
  const [err, setErr] = useState('');
  const any = shop.rating > 0 || Object.values(items).some((x) => x.rating > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setState('busy'); setErr('');
    const r = await fetch(`/api/bewerten/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, company: showCompany ? company : '', shop, items }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setState('done'); else { setErr(d.error ?? 'Senden fehlgeschlagen.'); setState('idle'); }
  }
  if (state === 'done') return <div className="box" style={{ textAlign: 'center' }}><h2 style={{ marginTop: 0 }}>Vielen Dank für Ihre Bewertung! ★</h2><p>Wir prüfen sie kurz und veröffentlichen sie dann im Shop. Ihre Rückmeldung hilft uns und anderen Kunden sehr.</p><a href="/" className="btn" style={{ display: 'inline-grid', placeItems: 'center' }}>Zum Shop</a></div>;

  const block = (title: string, v: Entry, set: (e: Entry) => void, ph: string) => (
    <div className="box rev-form">
      <strong>{title}</strong>
      <StarInput value={v.rating} onChange={(n) => set({ ...v, rating: n })} />
      {v.rating > 0 && <>
        <input placeholder="Überschrift (optional), z. B. „Top Qualität, schnelle Lieferung“" value={v.title} maxLength={80} onChange={(e) => set({ ...v, title: e.target.value })} />
        <textarea placeholder={ph} value={v.text} maxLength={1000} onChange={(e) => set({ ...v, text: e.target.value })} />
      </>}
    </div>
  );
  return (
    <form onSubmit={submit} className="rev-forms">
      {block('Wie zufrieden sind Sie insgesamt mit euro-trade.com?', shop, setShop, 'Beratung, Angebot, Lieferung, Kommunikation … (optional)')}
      {products.map((p) => <div key={p.id}>{block(p.name, items[p.id], (e) => setItems((x) => ({ ...x, [p.id]: e })), 'Qualität, Passform, Veredelung … (optional)')}</div>)}
      <div className="box form">
        <div className="two">
          <div><label>Angezeigter Name</label><input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required /></div>
          {company && <div><label style={{ display: 'flex', gap: 8, fontWeight: 400, marginTop: 34 }}><input type="checkbox" checked={showCompany} onChange={(e) => setShowCompany(e.target.checked)} style={{ width: 'auto' }} /> „{company}“ anzeigen</label></div>}
        </div>
        <p className="muted" style={{ fontSize: 13 }}>Ihre Bewertung wird mit Name, Datum und dem Hinweis „Verifizierter Kauf“ im Shop veröffentlicht. Ihre E-Mail-Adresse wird nicht angezeigt.</p>
        <button className="btn" disabled={!any || state === 'busy'}>{state === 'busy' ? 'Wird gesendet …' : 'Bewertung absenden'}</button>
        {err && <p className="err">{err}</p>}
      </div>
    </form>
  );
}
