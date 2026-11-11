'use client';
import { useState } from 'react';
import type { Inquiry } from '@/lib/store';

/** Admin: Korrekturabzug (Bild/PDF) hochladen und dem Kunden zur Freigabe senden */
export default function ProofSender({ no, proof, previews }: { no: string; proof: Inquiry['proof']; previews: { id: string; label: string }[] }) {
  const [ids, setIds] = useState<{ id: string; name: string }[]>(proof?.ids ?? []);
  const [note, setNote] = useState(proof?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function upload(files: FileList | null) {
    for (const f of Array.from(files ?? [])) {
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json().catch(() => ({}));
      if (r.ok) setIds((l) => [...l, { id: d.id, name: d.name }]); else setMsg({ ok: false, t: d.error ?? 'Upload fehlgeschlagen' });
    }
  }
  async function send() {
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/admin/anfrage/${no}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'proof', ids, note }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false); setMsg({ ok: r.ok, t: d.message ?? d.error ?? '' });
  }
  return (
    <div className="box">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <strong>Druck- / Stickfreigabe</strong>
        {proof?.approvedAt ? <span className="st st-angenommen">✓ freigegeben von {proof.approvedBy} · {new Date(proof.approvedAt).toLocaleDateString('de-DE')}</span>
          : proof?.sentAt ? <span className="st st-angebot">gesendet {new Date(proof.sentAt).toLocaleDateString('de-DE')} – wartet auf Freigabe</span>
          : proof?.changes?.length ? <span className="st st-neu">Änderung gewünscht</span> : null}
      </div>
      {proof?.changes?.map((c, k) => <p key={k} className="sys-warn" style={{ margin: '8px 0 0' }}>✎ {new Date(c.date).toLocaleDateString('de-DE')}: {c.text}</p>)}
      <p className="muted" style={{ fontSize: 13, margin: '8px 0' }}>Korrekturabzug als Bild oder PDF hochladen – der Kunde gibt ihn auf seiner Angebotsseite mit einem Klick frei.{previews.length ? ' Oder die Vorschau aus dem Shop verwenden:' : ''}</p>
      {previews.length > 0 && <div className="deco-row">{previews.map((p) => <button key={p.id} type="button" className="btn alt sm" disabled={ids.some((x) => x.id === p.id)} onClick={() => setIds((l) => [...l, { id: p.id, name: `Vorschau ${p.label}.png` }])}>+ Shop-Vorschau {p.label}</button>)}</div>}
      <div className="of-prev" style={{ marginTop: 10 }}>{ids.map((x) => <span key={x.id} className="pf-item">{/\.pdf$/i.test(x.name) ? <span className="file-ico">PDF</span> : <img src={`/api/upload/${x.id}`} alt="" />}<span>{x.name}</span><button type="button" className="x" onClick={() => setIds((l) => l.filter((y) => y.id !== x.id))}>×</button></span>)}</div>
      <div className="deco-row" style={{ marginTop: 8 }}><label className="btn alt sm upl">Datei hochladen<input type="file" multiple hidden accept=".png,.jpg,.jpeg,.webp,.pdf" onChange={(e) => upload(e.target.files)} /></label></div>
      <textarea className="deco-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hinweis an den Kunden, z. B. Stickfarben: Weiß, Gold – Breite 9 cm" />
      <div className="deco-row" style={{ marginTop: 8 }}><button className="btn" disabled={busy || !ids.length} onClick={send}>{busy ? 'Sendet …' : proof?.sentAt ? 'Erneut zur Freigabe senden' : 'Zur Freigabe an Kunden senden'}</button>{msg && <span className={msg.ok ? 'ok' : 'err'} style={{ fontSize: 14 }}>{msg.t}</span>}</div>
    </div>
  );
}
