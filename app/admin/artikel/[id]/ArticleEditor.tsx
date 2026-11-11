'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Color, Product } from '@/lib/types';

const prev = (src: string) => src.replace(/^\/api\/bild\//, '/api/upload/'); // Admin-Vorschau auch vor dem Speichern
const money = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

type F = Omit<Product, 'id' | 'categorySlug' | 'basePrice'> & { basePrice: string; tiersText: string; sizesText: string; featuresText: string; tagsText: string; specsText: string; pairsText: string };
export default function ArticleEditor({ p, custom, changed, categories, markup }: { p: Product; custom: boolean; changed: boolean; categories: string[]; markup: number }) {
  const router = useRouter();
  const [f, setF] = useState<F>({
    ...p, hidden: !!p.hidden, top: !!p.top,
    basePrice: p.basePrice != null ? String(p.basePrice).replace('.', ',') : '',
    tiersText: (p.baseTiers ?? []).map((t) => `${t.min}: ${String(t.price).replace('.', ',')}`).join('\n'),
    sizesText: p.sizes.join(', '), featuresText: (p.features ?? []).join('\n'), tagsText: (p.tags ?? []).join(', '), pairsText: (p.pairs ?? []).join(', '),
    specsText: Object.entries(p.specs ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n'),
  });
  const [msg, setMsg] = useState<{ ok: boolean; m: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (x: Partial<F>) => { setF((o) => ({ ...o, ...x })); setDirty(true); setMsg(null); };
  const ek = Number(f.basePrice.replace(',', '.'));
  const vk = ek > 0 ? Math.round(ek * (1 + markup / 100) * 100) / 100 : null;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const add: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json().catch(() => ({}));
      if (r.ok) add.push(`/api/bild/${d.id}`); else setMsg({ ok: false, m: d.error ?? 'Upload fehlgeschlagen' });
    }
    set({ images: [...f.images, ...add] });
    setBusy(false);
  }
  const move = (k: number, d: number) => { const a = [...f.images]; const [x] = a.splice(k, 1); a.splice(Math.max(0, Math.min(a.length, k + d)), 0, x); set({ images: a }); };
  const setColor = (k: number, c: Partial<Color>) => set({ colors: f.colors.map((x, i) => (i === k ? { ...x, ...c } : x)) });

  async function save() {
    setBusy(true);
    const data = {
      ...f,
      baseTiers: f.tiersText.split('\n').map((l) => l.split(/[:;=]/)).filter((x) => x.length === 2).map(([min, price]) => ({ min: Number(min.trim()), price: price.trim() })),
      sizes: f.sizesText.split(',').map((s) => s.trim()).filter(Boolean),
      features: f.featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
      tags: f.tagsText.split(',').map((s) => s.trim()).filter(Boolean),
      pairs: f.pairsText.split(/[,;\s]+/).map((s) => s.trim().toUpperCase()).filter(Boolean),
      specs: Object.fromEntries(f.specsText.split('\n').map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]).filter(([k, v]) => k && v)),
    };
    const r = await fetch('/api/admin/artikel', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, data }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setDirty(false); setMsg({ ok: true, m: 'Gespeichert – sofort im Shop sichtbar.' }); router.refresh(); } else setMsg({ ok: false, m: d.error ?? 'Fehler' });
  }
  async function reset() {
    if (!confirm(custom ? 'Diesen Artikel endgültig löschen?' : 'Alle eigenen Änderungen verwerfen? Es gelten wieder die Katalogdaten.')) return;
    const r = await fetch(`/api/admin/artikel?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' });
    if (r.ok) { if (custom) router.push('/admin/artikel'); else location.reload(); }
  }

  return (
    <div className="box form ae">
      <div className="ae-top">
        <label className="switch"><input type="checkbox" checked={!f.hidden} onChange={(e) => set({ hidden: !e.target.checked })} /> <b>{f.hidden ? 'Ausgeblendet' : 'Im Shop sichtbar'}</b></label>
        <label className="switch"><input type="checkbox" checked={!!f.top} onChange={(e) => set({ top: e.target.checked })} /> Oben anzeigen (Top-Artikel)</label>
        {changed && !custom && <span className="st st-angebot">Eigene Änderungen aktiv</span>}
      </div>

      <h3>Stammdaten</h3>
      <div className="ae-2">
        <div><label>Artikelname</label><input value={f.name} onChange={(e) => set({ name: e.target.value })} /></div>
        <div><label>Artikelnummer</label><input value={f.sku} onChange={(e) => set({ sku: e.target.value })} /></div>
        <div><label>Marke</label><input value={f.brand} onChange={(e) => set({ brand: e.target.value })} /></div>
        <div><label>Kategorie</label><input list="ae-cats" value={f.category} onChange={(e) => set({ category: e.target.value })} /><datalist id="ae-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></div>
        <div><label>Material</label><input value={f.material ?? ''} onChange={(e) => set({ material: e.target.value })} /></div>
        <div><label>Zusammensetzung</label><input value={f.composition ?? ''} onChange={(e) => set({ composition: e.target.value })} /></div>
      </div>

      <h3>Preise</h3>
      <div className="ae-2">
        <div><label>Einkaufspreis netto (EK)</label><input inputMode="decimal" placeholder="leer = Preis auf Anfrage" value={f.basePrice} onChange={(e) => set({ basePrice: e.target.value })} />
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{vk ? <>Verkaufspreis ca. <b>{money(vk)}</b> netto ({markup} % Aufschlag, wird gerundet). Kunden mit eigenem Aufschlag sehen ihren Preis.</> : 'Ohne EK erscheint „Preis auf Anfrage“.'}</div></div>
        <div><label>Staffel-EK <span className="muted" style={{ fontWeight: 400 }}>(eine Zeile je Staffel: Menge: EK)</span></label><textarea placeholder={'50: 5,90\n100: 5,40'} value={f.tiersText} onChange={(e) => set({ tiersText: e.target.value })} style={{ minHeight: 76 }} /></div>
      </div>

      <h3>Bilder <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>– das erste Bild ist das Hauptbild</span></h3>
      <div className="ae-imgs">
        {f.images.map((src, k) => (
          <div key={src + k} className="ae-img">
            <img src={prev(src)} alt="" />
            <div className="ae-img-act">
              <button type="button" disabled={k === 0} onClick={() => move(k, -1)} title="nach vorne">←</button>
              <button type="button" disabled={k === f.images.length - 1} onClick={() => move(k, 1)} title="nach hinten">→</button>
              <button type="button" onClick={() => set({ images: f.images.filter((_, i) => i !== k), colors: f.colors.map((c) => (c.image === src ? { ...c, image: undefined } : c)) })} title="entfernen">✕</button>
            </div>
            {k === 0 && <span className="ae-main">Hauptbild</span>}
          </div>
        ))}
        <label className="ae-add">{busy ? 'Lädt …' : '+ Bilder hochladen'}<input type="file" hidden multiple accept=".jpg,.jpeg,.png,.webp" onChange={(e) => upload(e.target.files)} /></label>
      </div>

      <h3>Farben</h3>
      <div className="ae-colors">
        {f.colors.map((c, k) => (
          <div key={k} className="ae-color">
            <input type="color" value={c.hex ?? '#cccccc'} onChange={(e) => setColor(k, { hex: e.target.value })} />
            <input value={c.name} onChange={(e) => setColor(k, { name: e.target.value })} />
            <select value={c.image ?? ''} onChange={(e) => setColor(k, { image: e.target.value || undefined })}>
              <option value="">Bild: automatisch</option>
              {f.images.map((s, i) => <option key={s} value={s}>Bild {i + 1}</option>)}
            </select>
            <button type="button" className="linkbtn" onClick={() => set({ colors: f.colors.filter((_, i) => i !== k) })}>entfernen</button>
          </div>
        ))}
        <button type="button" className="btn alt" style={{ height: 34 }} onClick={() => set({ colors: [...f.colors, { name: '', hex: '#cccccc' }] })}>+ Farbe</button>
      </div>

      <h3>Größen & Details</h3>
      <div className="ae-2">
        <div><label>Größen <span className="muted" style={{ fontWeight: 400 }}>(mit Komma, in Reihenfolge)</span></label><input value={f.sizesText} onChange={(e) => set({ sizesText: e.target.value })} placeholder="XS, S, M, L, XL, XXL" /></div>
        <div><label>Größentabelle (Link)</label><input value={f.sizeChart ?? ''} onChange={(e) => set({ sizeChart: e.target.value })} placeholder="https://…" /></div>
        <div><label>Merkmale <span className="muted" style={{ fontWeight: 400 }}>(eine Zeile je Merkmal)</span></label><textarea value={f.featuresText} onChange={(e) => set({ featuresText: e.target.value })} style={{ minHeight: 110 }} /></div>
        <div><label>Technische Daten <span className="muted" style={{ fontWeight: 400 }}>(Bezeichnung: Wert)</span></label><textarea value={f.specsText} onChange={(e) => set({ specsText: e.target.value })} style={{ minHeight: 110 }} /></div>
        <div><label>Suchbegriffe / Tags <span className="muted" style={{ fontWeight: 400 }}>(mit Komma)</span></label><input value={f.tagsText} onChange={(e) => set({ tagsText: e.target.value })} /></div>
        <div><label>Passende Artikel <span className="muted" style={{ fontWeight: 400 }}>(Art.-Nr. mit Komma, z. B. Damenmodell)</span></label><input value={f.pairsText} onChange={(e) => set({ pairsText: e.target.value })} placeholder="JN841, JN1000" /></div>
        <div><label>Zielgruppe</label><input value={f.gender ?? ''} onChange={(e) => set({ gender: e.target.value })} placeholder="Unisex, Herren, Damen, Kinder" /></div>
      </div>
      <label>Herstellerbeschreibung</label>
      <textarea value={f.description} onChange={(e) => set({ description: e.target.value })} style={{ minHeight: 110 }} />

      <div className="admin-actions ae-save">
        <button className="btn" disabled={!dirty || busy} onClick={save}>Speichern</button>
        {(changed || custom) && <button className="linkbtn" onClick={reset}>{custom ? 'Artikel löschen' : 'Eigene Änderungen verwerfen'}</button>}
        {msg && <span className={`note ${msg.ok ? 'ok' : 'err'}`} style={{ margin: 0 }}>{msg.m}</span>}
      </div>
    </div>
  );
}
