'use client';
import { useMemo, useState } from 'react';
import type { TeamShop } from '@/lib/teamshop';

type Orders = { inquiries: number; items: { sku: string; name: string; color: string; sizes: Record<string, number>; total: number }[]; people: { no: string; name: string; email: string; date: string; pieces: number; status: string; personal: string[] }[] };
type Shop = TeamShop & { orders: Orders };
type Brief = { id: string; sku: string; name: string; brand: string };
const empty = (): Partial<TeamShop> => ({ name: '', active: true, items: [], method: 'Stick', positions: ['Brust links'], personalize: 'aus', deadline: '', note: '', contact: '' });

export default function TeamShopEditor({ shops: initial, products, methods, positions, base }: { shops: Shop[]; products: Brief[]; methods: string[]; positions: string[]; base: string }) {
  const [shops, setShops] = useState(initial);
  const [edit, setEdit] = useState<Partial<TeamShop> | null>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const hits = useMemo(() => { const t = q.trim().toLowerCase(); return t.length < 2 ? [] : products.filter((p) => `${p.sku} ${p.name} ${p.brand}`.toLowerCase().includes(t)).slice(0, 12); }, [q, products]);

  async function upload(f?: File | null) {
    if (!f) return;
    const fd = new FormData(); fd.append('file', f);
    const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json().catch(() => ({}));
    if (r.ok) setEdit((e) => ({ ...e!, logoId: d.id, logoName: d.name })); else setMsg(d.error ?? 'Upload fehlgeschlagen');
  }
  async function save() {
    if (!edit) return;
    setBusy(true); setMsg('');
    const r = await fetch('/api/admin/teamshops', { method: edit.slug ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg(d.error ?? 'Fehler'); return; }
    setShops((l) => { const ex = l.find((x) => x.slug === d.shop.slug); return ex ? l.map((x) => (x.slug === d.shop.slug ? { ...x, ...d.shop } : x)) : [...l, { ...d.shop, orders: { inquiries: 0, items: [], people: [] } }]; });
    setEdit(null);
  }
  async function del(slug: string) {
    if (!confirm('Team-Shop löschen? Bisherige Anfragen bleiben erhalten.')) return;
    await fetch(`/api/admin/teamshops?slug=${slug}`, { method: 'DELETE' });
    setShops((l) => l.filter((x) => x.slug !== slug));
  }
  function csv(s: Shop) {
    const sizes = [...new Set(s.orders.items.flatMap((i) => Object.keys(i.sizes)))];
    const rows = [['Art.-Nr.', 'Artikel', 'Farbe', ...sizes, 'Gesamt'], ...s.orders.items.map((i) => [i.sku, i.name, i.color, ...sizes.map((z) => String(i.sizes[z] ?? '')), String(i.total)]), [], ['Anfrage', 'Name', 'E-Mail', 'Teile', 'Status', 'Name/Nummer'], ...s.orders.people.map((p) => [p.no, p.name, p.email, String(p.pieces), p.status, p.personal.join(', ')])];
    const blob = new Blob(['﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `sammelbestellung-${s.slug}.csv`; a.click();
  }

  return (
    <div className="ts">
      <div className="pe-top"><span style={{ flex: 1 }} /><button className="btn" onClick={() => { setEdit(empty()); setQ(''); }}>+ Neuer Team-Shop</button></div>
      {!shops.length && !edit && <div className="box muted">Noch kein Team-Shop. Lege den ersten an – z. B. für einen Fußballverein mit Hoodie, T-Shirt und Trainingsjacke.</div>}
      {shops.map((s) => {
        const url = `${base}/team/${s.slug}`;
        const pieces = s.orders.items.reduce((a, i) => a + i.total, 0);
        return (
          <div key={s.slug} className={`box ts-card ${s.active ? '' : 'off'}`}>
            <div className="ts-head">
              {s.logoId ? <img src={`/api/upload/${s.logoId}`} alt="" /> : <span className="ts-ph">{s.name.slice(0, 2).toUpperCase()}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{s.name}</b>{!s.active && <span className="muted"> · deaktiviert</span>}
                <div className="muted" style={{ fontSize: 13 }}>{s.items.length} Artikel · {s.method} {s.positions.join(', ')}{s.personalize !== 'aus' ? ` · ${s.personalize === 'beides' ? 'Name + Nummer' : s.personalize === 'name' ? 'Name' : 'Nummer'}` : ''}{s.deadline ? ` · Bestellschluss ${new Date(s.deadline).toLocaleDateString('de-DE')}` : ''}</div>
                <div className="ts-link"><code>{url}</code><button className="linkbtn" onClick={() => { navigator.clipboard?.writeText(url); setMsg(`Link kopiert: ${url}`); }}>Link kopieren</button><a className="linkbtn" href={`/team/${s.slug}`} target="_blank">ansehen</a></div>
              </div>
              <div className="ts-stats"><b>{s.orders.inquiries}</b><span>Anfragen</span></div>
              <div className="ts-stats"><b>{pieces}</b><span>Teile</span></div>
              <div className="ts-actions">
                <button className="btn alt sm" onClick={() => { setEdit({ ...s }); setQ(''); }}>Bearbeiten</button>
                {s.orders.inquiries > 0 && <button className="btn alt sm" onClick={() => setOpen(open === s.slug ? null : s.slug)}>Sammelbestellung</button>}
              </div>
            </div>
            {open === s.slug && <div className="ts-orders">
              <table className="atable"><thead><tr><th>Artikel</th><th>Farbe</th><th>Größen</th><th>Gesamt</th></tr></thead>
                <tbody>{s.orders.items.map((i) => <tr key={i.sku + i.color}><td><b>{i.sku}</b> {i.name}</td><td>{i.color}</td><td>{Object.entries(i.sizes).map(([z, n]) => `${z}: ${n}`).join(' · ')}</td><td><b>{i.total}</b></td></tr>)}</tbody></table>
              <h3 style={{ margin: '16px 0 6px', fontSize: 15 }}>Bestellungen der Mitglieder</h3>
              <table className="atable"><thead><tr><th>Anfrage</th><th>Name</th><th>Teile</th><th>Name / Nummer</th><th>Status</th></tr></thead>
                <tbody>{s.orders.people.map((p) => <tr key={p.no}><td><a className="alink" href={`/admin/anfrage/${p.no}`}>{p.no}</a></td><td>{p.name}<div className="muted" style={{ fontSize: 12 }}>{p.email}</div></td><td>{p.pieces}</td><td>{p.personal.join(', ') || '–'}</td><td>{p.status}</td></tr>)}</tbody></table>
              <button className="btn alt sm" style={{ marginTop: 10 }} onClick={() => csv(s)}>Als Excel/CSV herunterladen</button>
            </div>}
          </div>
        );
      })}
      {msg && <p className="ok" style={{ fontSize: 14 }}>{msg}</p>}

      {edit && <div className="cmd-wrap" onClick={() => setEdit(null)}>
        <div className="cmd ts-form" onClick={(e) => e.stopPropagation()}>
          <div className="cmd-head"><b>{edit.slug ? `Team-Shop bearbeiten` : 'Neuer Team-Shop'}</b><button className="cmd-x" onClick={() => setEdit(null)}>×</button></div>
          <div className="form cmd-body">
            <label>Name des Vereins / der Firma *</label><input value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="z. B. TuS Eving-Lindenhorst" />
            <label>Vereinslogo</label>
            <div className="deco-row">{edit.logoId && <img src={`/api/upload/${edit.logoId}`} alt="" style={{ height: 48, maxWidth: 120, objectFit: 'contain' }} />}<label className="btn alt sm upl">{edit.logoId ? 'Logo ändern' : 'Logo hochladen'}<input type="file" hidden accept=".png,.jpg,.jpeg,.svg,.webp,.pdf,.ai,.eps" onChange={(e) => upload(e.target.files?.[0])} /></label></div>
            <div className="two">
              <div><label>Veredelung</label><select value={edit.method} onChange={(e) => setEdit({ ...edit, method: e.target.value })}>{methods.filter((m) => m !== 'Beratung gewünscht').map((m) => <option key={m}>{m}</option>)}</select></div>
              <div><label>Name / Nummer</label><select value={edit.personalize} onChange={(e) => setEdit({ ...edit, personalize: e.target.value as TeamShop['personalize'] })}><option value="aus">nicht anbieten</option><option value="name">Name</option><option value="nummer">Nummer</option><option value="beides">Name + Nummer</option></select></div>
            </div>
            <label>Logo-Position(en)</label>
            <div className="deco-row">{positions.slice(0, 12).map((x) => <button key={x} type="button" className={`size ${edit.positions?.includes(x) ? 'on' : ''}`} onClick={() => setEdit({ ...edit, positions: edit.positions?.includes(x) ? edit.positions.filter((y) => y !== x) : [...(edit.positions ?? []), x] })}>{x}</button>)}</div>
            <div className="two">
              <div><label>Bestellschluss (optional)</label><input type="date" value={edit.deadline ?? ''} onChange={(e) => setEdit({ ...edit, deadline: e.target.value })} /></div>
              <div><label>Ansprechpartner im Verein</label><input value={edit.contact ?? ''} onChange={(e) => setEdit({ ...edit, contact: e.target.value })} placeholder="z. B. Jugendwart Max Meier" /></div>
            </div>
            <label>Hinweis auf der Shop-Seite</label><textarea rows={2} value={edit.note ?? ''} onChange={(e) => setEdit({ ...edit, note: e.target.value })} placeholder="z. B. Abholung beim Training am 12.12." />
            <label>Artikel ({edit.items?.length ?? 0})</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Artikel suchen: Name, Art.-Nr. oder Marke …" />
            {hits.length > 0 && <div className="ts-hits">{hits.map((p) => <button key={p.id} type="button" disabled={edit.items?.includes(p.id)} onClick={() => setEdit({ ...edit, items: [...(edit.items ?? []), p.id] })}><b>{p.sku}</b> {p.name} <span className="muted">{p.brand}</span></button>)}</div>}
            <div className="ts-sel">{(edit.items ?? []).map((id) => <span key={id}>{byId.get(id)?.sku ?? id} {byId.get(id)?.name}<button type="button" onClick={() => setEdit({ ...edit, items: edit.items!.filter((x) => x !== id) })}>×</button></span>)}</div>
            <label className="ds-check"><input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Shop ist aktiv</label>
            <div className="deco-row" style={{ marginTop: 10 }}>
              <button className="btn" disabled={busy || !edit.name?.trim()} onClick={save}>{busy ? 'Speichert …' : 'Speichern'}</button>
              {edit.slug && <button className="linkbtn err" onClick={() => { del(edit.slug!); setEdit(null); }}>Löschen</button>}
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
