'use client';
import { useState } from 'react';
import type { Review } from '@/lib/store';

const LBL = { pending: 'Wartet auf Freigabe', approved: 'Veröffentlicht', rejected: 'Abgelehnt' } as const;
export default function Moderation({ initial }: { initial: Review[] }) {
  const [list, setList] = useState(initial);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  async function patch(id: string, data: Partial<Review>) {
    const r = await fetch('/api/admin/bewertungen', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }) });
    if (r.ok) setList((l) => l.map((x) => (x.id === id ? { ...x, ...data } : x)));
  }
  const shown = list.filter((r) => r.status === tab);
  return (
    <>
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
