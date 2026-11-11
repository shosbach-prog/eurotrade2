'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewArticle({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', sku: '', brand: '', category: '' });
  const [err, setErr] = useState('');
  async function create(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch('/api/admin/artikel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) router.push(`/admin/artikel/${d.id}`); else setErr(d.error ?? 'Fehler');
  }
  if (!open) return <button className="btn" onClick={() => setOpen(true)}>+ Neuer Artikel</button>;
  return (
    <form className="box form ae-new" onSubmit={create}>
      <input required placeholder="Artikelname" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input required placeholder="Artikelnummer" value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} />
      <input placeholder="Marke" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} />
      <input list="na-cats" placeholder="Kategorie" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
      <datalist id="na-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      <button className="btn">Anlegen</button>
      <button type="button" className="linkbtn" onClick={() => setOpen(false)}>Abbrechen</button>
      {err && <div className="note err" style={{ width: '100%' }}>{err}</div>}
      <div className="muted" style={{ fontSize: 12, width: '100%' }}>Neue Artikel sind zunächst ausgeblendet – erst Bilder, Preis und Größen ergänzen, dann sichtbar schalten.</div>
    </form>
  );
}
