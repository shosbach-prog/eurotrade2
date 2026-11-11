'use client';
import { useState } from 'react';
import type { Review } from '@/lib/store';

const LBL = { pending: 'Wartet auf Freigabe', approved: 'Veröffentlicht', rejected: 'Abgelehnt' } as const;
type Order = { no: string; who: string; name: string; company: string; products: [string, string][] };
export default function Moderation({ initial, orders }: { initial: Review[]; orders: Order[] }) {
  const [list, setList] = useState(initial);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  async function patch(id: string, data: Partial<Review>) {
    const r = await fetch('/api/admin/bewertungen', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }) });
    if (r.ok) setList((l) => l.map((x) => (x.id === id ? { ...x, ...data } : x)));
  }
  const shown = list.filter((r) => r.status === tab);
  const [form, setForm] = useState<{ open: boolean; inquiryNo: string; productId: string; rating: number; title: string; text: string; name: string; company: string; source: string; incentive: string; consent: boolean; err: string }>({ open: false, inquiryNo: '', productId: '', rating: 5, title: '', text: '', name: '', company: '', source: 'email', incentive: '', consent: false, err: '' });
  const ord = orders.find((o) => o.no === form.inquiryNo);
  async function create() {
    const r = await fetch('/api/admin/bewertungen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setForm((f) => ({ ...f, err: d.error ?? 'Fehler' })); return; }
    setList((l) => [d.review, ...l]); setTab('approved'); setForm((f) => ({ ...f, open: false, title: '', text: '', consent: false, err: '' }));
  }
  return (
    <>
      <div className="admin-actions" style={{ marginTop: 0 }}>
        <button className="btn alt" onClick={() => setForm((f) => ({ ...f, open: !f.open }))}>+ Bewertung erfassen (per E-Mail/Telefon erhalten)</button>
      </div>
      {form.open && (
        <div className="box form" style={{ marginBottom: 16 }}>
          {!orders.length ? <p className="muted">Noch keine angenommenen oder gelieferten Aufträge – Bewertungen können nur zu echten Aufträgen erfasst werden.</p> : <>
            <div className="two">
              <div><label>Auftrag *</label><select className="sel" value={form.inquiryNo} onChange={(e) => { const o = orders.find((x) => x.no === e.target.value); setForm((f) => ({ ...f, inquiryNo: e.target.value, productId: '', name: o ? o.name.split(' ')[0] + (o.name.split(' ')[1] ? ` ${o.name.split(' ').pop()![0]}.` : '') : '', company: o?.company ?? '' })); }}><option value="">– wählen –</option>{orders.map((o) => <option key={o.no} value={o.no}>{o.no} · {o.who}</option>)}</select></div>
              <div><label>Bewertet wird</label><select className="sel" value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}><option value="">Shop / Service</option>{ord?.products.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select></div>
            </div>
            <label>Sterne *</label>
            <div className="deco-row">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" className={`size ${form.rating === n ? 'on' : ''}`} onClick={() => setForm((f) => ({ ...f, rating: n }))}>{'★'.repeat(n)}</button>)}</div>
            <label>Überschrift</label><input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <label>Text (Wortlaut des Kunden)</label><textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
            <div className="two">
              <div><label>Anzeigename</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><label>Firma / Verein (optional)</label><input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} /></div>
            </div>
            <div className="two">
              <div><label>Erhalten</label><select className="sel" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}><option value="email">per E-Mail</option><option value="telefon">telefonisch</option><option value="persoenlich">persönlich</option></select></div>
              <div><label>Gegenleistung (wird öffentlich angezeigt)</label><select className="sel" value={form.incentive} onChange={(e) => setForm((f) => ({ ...f, incentive: e.target.value }))}><option value="">keine</option><option>Kostenloses Testprodukt erhalten</option><option>Vergünstigtes Testprodukt erhalten</option></select></div>
            </div>
            <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" style={{ width: 'auto' }} checked={form.consent} onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))} /> Der Kunde hat der Veröffentlichung zugestimmt, und der Text gibt seine Aussage unverändert wieder.</label>
            <div className="admin-actions"><button className="btn" disabled={!form.inquiryNo || !form.consent} onClick={create}>Bewertung veröffentlichen</button>{form.err && <span className="err">{form.err}</span>}</div>
          </>}
        </div>
      )}
      <div className="chips" style={{ margin: '0 0 14px' }}>
        {(Object.keys(LBL) as (keyof typeof LBL)[]).map((k) => <button key={k} className={`chip ${tab === k ? 'chip-on' : ''}`} onClick={() => setTab(k)}>{LBL[k]} ({list.filter((r) => r.status === k).length})</button>)}
      </div>
      {!shown.length && <div className="box muted">Keine Bewertungen in dieser Ansicht.</div>}
      <div className="cust-list">
        {shown.map((r) => (
          <div key={r.id} className="box">
            <div className="my-top">
              <div><span style={{ color: '#ffb300', fontSize: 18 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span> <b>{r.productName ?? 'Shop / Service'}</b> <span className="muted">· {r.name}{r.company ? ` · ${r.company}` : ''} · Auftrag {r.inquiryNo} · {new Date(r.date).toLocaleDateString('de-DE')}</span></div>
            </div>
            {r.title && <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{r.title}</p>}
            {r.text && <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{r.text}</p>}
            <div className="form" style={{ marginTop: 10 }}>
              <select className="sel" style={{ marginBottom: 8 }} value={r.incentive ?? ''} onChange={(e) => patch(r.id, { incentive: e.target.value || null })}>
                <option value="">Keine Gegenleistung</option><option>Kostenloses Testprodukt erhalten</option><option>Vergünstigtes Testprodukt erhalten</option>
              </select>
              <textarea placeholder="Öffentliche Antwort (optional)" defaultValue={r.reply ?? ''} onBlur={(e) => e.target.value !== (r.reply ?? '') && patch(r.id, { reply: e.target.value })} style={{ minHeight: 60 }} />
            </div>
            <div className="admin-actions" style={{ marginBottom: 0 }}>
              {r.status !== 'approved' && <button className="btn" onClick={() => patch(r.id, { status: 'approved' })}>Veröffentlichen</button>}
              {r.status !== 'rejected' && <button className="btn alt" onClick={() => patch(r.id, { status: 'rejected' })}>Ablehnen</button>}
              {r.status !== 'pending' && <button className="linkbtn" onClick={() => patch(r.id, { status: 'pending' })}>zurück auf „wartend“</button>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
