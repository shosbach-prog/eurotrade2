'use client';
import { useState } from 'react';
import type { Reference } from '@/lib/store';

export default function RefEditor({ initial }: { initial: Reference[] }) {
  const [refs, setRefs] = useState<Reference[]>(initial);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const upd = (k: number, p: Partial<Reference>) => { setRefs((r) => r.map((x, n) => (n === k ? { ...x, ...p } : x))); setDirty(true); };
  async function upload(k: number, f?: File | null) {
    if (!f) return;
    if (!/\.(png|jpe?g|webp)$/i.test(f.name)) { alert('Bitte ein Foto (JPG, PNG oder WebP) wählen.'); return; }
    const fd = new FormData(); fd.append('file', f);
    const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json().catch(() => ({}));
    if (r.ok) upd(k, { imageId: d.id, imageName: d.name }); else alert(d.error ?? 'Upload fehlgeschlagen');
  }
  async function save() {
    const r = await fetch('/api/admin/referenzen', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refs }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setDirty(false); setMsg({ ok: true, t: 'Gespeichert – auf der Startseite sichtbar.' }); } else setMsg({ ok: false, t: d.error ?? 'Fehler' });
  }
  const move = (k: number, d: number) => { setRefs((r) => { const a = [...r]; const [x] = a.splice(k, 1); a.splice(Math.max(0, Math.min(a.length, k + d)), 0, x); return a; }); setDirty(true); };
  return (
    <>
      <div className="admin-actions" style={{ marginTop: 0 }}>
        <button className="btn" onClick={() => { setRefs((r) => [{ id: '', title: '', text: '', tag: '' }, ...r]); setDirty(true); }}>+ Neue Referenz</button>
        <button className="btn alt" disabled={!dirty} onClick={save}>{dirty ? 'Änderungen speichern' : 'Gespeichert'}</button>
        {msg && <span className={msg.ok ? 'ok' : 'err'}>{msg.t}</span>}
      </div>
      {!refs.length && <div className="box muted">Noch keine Referenzen. Ohne Einträge wird der Bereich auf der Startseite ausgeblendet.</div>}
      <div className="ref-admin">
        {refs.map((r, k) => (
          <div key={k} className="box form ref-item">
            <div className="ref-img">
              {r.imageId ? <img src={`/api/upload/${r.imageId}`} alt="" /> : <span className="muted">Kein Foto</span>}
              <label className="btn alt upl">Foto wählen<input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={(e) => upload(k, e.target.files?.[0])} /></label>
            </div>
            <div style={{ flex: 1 }}>
              <div className="two">
                <div><label>Kunde / Titel *</label><input value={r.title} onChange={(e) => upd(k, { title: e.target.value })} placeholder="z. B. SV Musterstadt – Trikots Saison 26/27" /></div>
                <div><label>Kategorie</label><input value={r.tag ?? ''} onChange={(e) => upd(k, { tag: e.target.value })} placeholder="Verein, Handwerk, Gastro …" /></div>
              </div>
              <label>Zeigen bei (optional)</label>
              <input value={r.match ?? ''} onChange={(e) => upd(k, { match: e.target.value })} placeholder="Artikel-Nr., Kategorie oder Marke, kommagetrennt – z. B. Sweatshirts, Stanley/Stella" />
              <label>Kurzbeschreibung</label>
              <textarea value={r.text} onChange={(e) => upd(k, { text: e.target.value })} placeholder="z. B. 120 Hoodies mit Stick auf der Brust, Namen auf dem Rücken, Lieferung in 8 Werktagen" />
              <div className="admin-actions" style={{ margin: '10px 0 0' }}>
                <button type="button" className="linkbtn" onClick={() => move(k, -1)}>↑ nach oben</button>
                <button type="button" className="linkbtn" onClick={() => move(k, 1)}>↓ nach unten</button>
                <span style={{ flex: 1 }} />
                <button type="button" className="linkbtn err" onClick={() => { setRefs((x) => x.filter((_, n) => n !== k)); setDirty(true); }}>Löschen</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
