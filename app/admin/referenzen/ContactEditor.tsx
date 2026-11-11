'use client';
import { useState } from 'react';
import type { ContactPerson } from '@/lib/store';

const EMPTY: ContactPerson = { name: '', role: '', phone: '', email: '', text: '', hours: '', photoId: null };

/** Persönlicher Ansprechpartner mit Foto – erscheint im Warenkorb und auf Artikelseiten */
export default function ContactEditor({ initial }: { initial: ContactPerson | null }) {
  const [c, setC] = useState<ContactPerson>(initial ?? EMPTY);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const up = (p: Partial<ContactPerson>) => { setC((x) => ({ ...x, ...p })); setMsg(null); };
  async function upload(f?: File | null) {
    if (!f) return;
    if (!/\.(png|jpe?g|webp)$/i.test(f.name)) { alert('Bitte ein Foto (JPG, PNG oder WebP) wählen.'); return; }
    const fd = new FormData(); fd.append('file', f);
    const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json().catch(() => ({}));
    if (r.ok) up({ photoId: d.id }); else alert(d.error ?? 'Upload fehlgeschlagen');
  }
  async function save(clear = false) {
    const r = await fetch('/api/admin/referenzen', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contact: clear ? null : c }) });
    if (clear) setC(EMPTY);
    setMsg(r.ok ? { ok: true, t: clear ? 'Entfernt.' : 'Gespeichert – im Warenkorb und auf Artikelseiten sichtbar.' } : { ok: false, t: 'Fehler beim Speichern' });
  }
  const ini = c.name.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="box form ref-item" style={{ marginBottom: 24 }}>
      <div className="ref-img">
        {c.photoId ? <img src={`/api/upload/${c.photoId}`} alt="" style={{ borderRadius: '50%', aspectRatio: '1', objectFit: 'cover' }} /> : <span className="cp-ini big">{ini || '?'}</span>}
        <label className="btn alt upl">Foto wählen<input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={(e) => upload(e.target.files?.[0])} /></label>
        {c.photoId && <button type="button" className="linkbtn" onClick={() => up({ photoId: null })}>Foto entfernen</button>}
      </div>
      <div style={{ flex: 1 }}>
        <div className="two">
          <div><label>Name *</label><input value={c.name} onChange={(e) => up({ name: e.target.value })} placeholder="z. B. Sebastian Hosbach" /></div>
          <div><label>Funktion</label><input value={c.role} onChange={(e) => up({ role: e.target.value })} placeholder="Ihr Ansprechpartner" /></div>
        </div>
        <div className="two">
          <div><label>Telefon</label><input value={c.phone} onChange={(e) => up({ phone: e.target.value })} placeholder="+49 …" /></div>
          <div><label>E-Mail</label><input value={c.email} onChange={(e) => up({ email: e.target.value })} placeholder="info@euro-trade.com" /></div>
        </div>
        <label>Erreichbar</label><input value={c.hours ?? ''} onChange={(e) => up({ hours: e.target.value })} placeholder="Mo–Fr 8–17 Uhr" />
        <label>Kurzer Satz</label><textarea value={c.text} onChange={(e) => up({ text: e.target.value })} placeholder="Fragen zu Größen, Veredelung oder Mengen? Ich helfe Ihnen gern persönlich weiter." />
        <div className="admin-actions" style={{ margin: '10px 0 0' }}>
          <button type="button" className="btn" disabled={!c.name.trim()} onClick={() => save()}>Speichern</button>
          {initial && <button type="button" className="linkbtn err" onClick={() => save(true)}>Ansprechpartner ausblenden</button>}
          {msg && <span className={msg.ok ? 'ok' : 'err'}>{msg.t}</span>}
        </div>
      </div>
    </div>
  );
}
