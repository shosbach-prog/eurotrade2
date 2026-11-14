'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TeamShop } from '@/lib/teamshop';
import ArticlePicker, { PickedStrip, type PickGroup, type PickItem } from '@/components/ArticlePicker';

type Orders = { inquiries: number; items: { sku: string; name: string; color: string; motif?: string; sizes: Record<string, number>; total: number }[]; people: { no: string; name: string; email: string; date: string; pieces: number; status: string; personal: string[] }[] };
type Stats = { rows: { week: string; orders: number; pieces: number; revenue: number; margin: number; paid: number }[]; top: { name: string; qty: number }[]; tot: { orders: number; pieces: number; revenue: number; margin: number; paid: number }; missingEk: number };
type Shop = TeamShop & { orders: Orders; stats: Stats };
type Brief = PickItem;
const empty = (): Partial<TeamShop> => ({ name: '', active: true, items: [], method: 'Stick', positions: ['Brust links'], personalize: 'aus', deadline: '', note: '', contact: '' });

export default function TeamShopEditor({ shops: initial, products, groups, methods, positions, base }: { shops: Shop[]; products: Brief[]; groups: PickGroup[]; methods: string[]; positions: string[]; base: string }) {
  const router = useRouter();
  const [shops, setShops] = useState(initial);
  const [edit, setEdit] = useState<Partial<TeamShop> | null>(null);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState<string | null>(null);
  const money = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

  async function upload(f?: File | null) {
    if (!f) return;
    const fd = new FormData(); fd.append('file', f);
    const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json().catch(() => ({}));
    if (r.ok) setEdit((e) => ({ ...e!, logoId: d.id, logoName: d.name })); else setMsg(d.error ?? 'Upload fehlgeschlagen');
  }
  const [upBusy, setUpBusy] = useState(0);
  const [drag, setDrag] = useState(false);
  async function uploadMotifs(files?: FileList | null, key: 'motifs' | 'logos' = 'motifs') {
    const all = [...(files ?? [])];
    const list = all.filter((f) => /\.(png|jpe?g|svg|webp)$/i.test(f.name) || /^image\//.test(f.type));
    if (!list.length) { if (all.length) setMsg('Bitte Bilddateien (PNG, JPG, SVG) wählen – ZIP-Dateien vorher entpacken.'); return; }
    setUpBusy(list.length); setMsg('');
    for (const f of list) {
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json().catch(() => ({}));
      if (r.ok) setEdit((e) => ({ ...e!, [key]: [...(e![key] ?? []), { id: d.id, name: f.name.replace(/\.[^.]+$/, '').replace(/^\d+[\s._-]*/, '').replace(/[_-]+/g, ' ').trim().slice(0, 80) || (key === 'logos' ? 'Logo' : 'Motiv'), at: new Date().toISOString() }] }));
      else setMsg(`${f.name}: ${d.error ?? 'Upload fehlgeschlagen'}`);
      setUpBusy((n) => n - 1);
    }
  }
  const setMotif = (i: number, patch: Partial<{ name: string }>) => setEdit((e) => ({ ...e!, motifs: e!.motifs!.map((m, k) => (k === i ? { ...m, ...patch } : m)) }));
  const moveMotif = (i: number, d: number) => setEdit((e) => { const l = [...(e!.motifs ?? [])]; const j = i + d; if (j < 0 || j >= l.length) return e; [l[i], l[j]] = [l[j], l[i]]; return { ...e!, motifs: l }; });
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
    const r = await fetch(`/api/admin/teamshops?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
    if (!r.ok) { setMsg('Löschen fehlgeschlagen – bitte neu anmelden und erneut versuchen.'); return; }
    setShops((l) => l.filter((x) => x.slug !== slug));
    router.refresh();
  }
  function csv(s: Shop) {
    const sizes = [...new Set(s.orders.items.flatMap((i) => Object.keys(i.sizes)))];
    const rows = [['Motiv', 'Art.-Nr.', 'Artikel', 'Farbe', ...sizes, 'Gesamt'], ...s.orders.items.map((i) => [i.motif ?? '', i.sku, i.name, i.color, ...sizes.map((z) => String(i.sizes[z] ?? '')), String(i.total)]), [], ['Anfrage', 'Name', 'E-Mail', 'Teile', 'Status', 'Name/Nummer'], ...s.orders.people.map((p) => [p.no, p.name, p.email, String(p.pieces), p.status, p.personal.join(', ')])];
    const blob = new Blob(['﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `sammelbestellung-${s.slug}.csv`; a.click();
  }

  return (
    <div className="ts">
      <div className="pe-top"><span style={{ flex: 1 }} /><button className="btn" onClick={() => { setEdit(empty()); }}>+ Neuer Team-Shop</button></div>
      {!shops.length && !edit && <div className="box muted">Noch kein Team-Shop. Lege den ersten an – z. B. für einen Fußballverein mit Hoodie, T-Shirt und Trainingsjacke.</div>}
      {shops.map((s) => {
        const url = `${base}/team/${s.slug}`;
        const pieces = s.orders.items.reduce((a, i) => a + i.total, 0);
        return (
          <div key={s.slug} className={`box ts-card ${s.active ? '' : 'off'}`}>
            <div className="ts-head">
              {s.logoId ? <img src={`/api/upload/${s.logoId}?w=320`} alt="" /> : <span className="ts-ph">{s.name.slice(0, 2).toUpperCase()}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{s.name}</b>{!s.active && <span className="muted"> · deaktiviert</span>}{s.motifs?.length ? (s.rights?.docId || s.rights?.date ? <span className="ts-ok" title={`Freigabe: ${s.rights?.holder ?? ''} ${s.rights?.date ?? ''}`}> ✓ Rechte</span> : <span className="ts-warn"> ⚠ Freigabe fehlt</span>) : null}
                <div className="muted" style={{ fontSize: 13 }}>{s.items.length} Artikel{s.motifs?.length ? ` · ${s.motifs.length} Motive` : ''}{s.logos?.length ? ` · ${s.logos.length + 1} Logos` : ''}{s.price ? ` · Festpreis ${s.price.toFixed(2).replace('.', ',')} € netto` : ''}{s.backPrice ? ` · Rückendruck +${s.backPrice.toFixed(2).replace('.', ',')} €` : ''}{s.direct ? ` · Einzelversand${s.shipGross ? ` ${s.shipGross.toFixed(2).replace('.', ',')} €` : ''}` : ''} · {s.method} {s.positions.join(', ')}{s.personalize !== 'aus' ? ` · ${s.personalize === 'beides' ? 'Name + Nummer' : s.personalize === 'name' ? 'Name' : 'Nummer'}` : ''}{s.deadline ? ` · Bestellschluss ${new Date(s.deadline).toLocaleDateString('de-DE')}` : ''}</div>
                <div className="ts-link"><code>{url}</code><button className="linkbtn" onClick={() => { navigator.clipboard?.writeText(url); setMsg(`Link kopiert: ${url}`); }}>Link kopieren</button><a className="linkbtn" href={`/team/${s.slug}`} target="_blank">ansehen</a></div>
              </div>
              <div className="ts-stats"><b>{s.orders.inquiries}</b><span>Anfragen</span></div>
              <div className="ts-stats"><b>{pieces}</b><span>Teile</span></div>
              <div className="ts-actions">
                <button className="btn alt sm" onClick={() => { setEdit({ ...s }); }}>Bearbeiten</button>
                {s.orders.inquiries > 0 && <button className="btn alt sm" onClick={() => setOpen(open === s.slug ? null : s.slug)}>Sammelbestellung</button>}
                {s.orders.inquiries > 0 && <button className="btn alt sm" onClick={() => setStatsOpen(statsOpen === s.slug ? null : s.slug)}>Auswertung</button>}
                <a className="btn alt sm" href={`/team/${s.slug}/story.jpg`} download={`${s.slug}-story.jpg`} title="Story-Grafik 9:16 für Instagram/WhatsApp-Status">Story-Bild</a>
                <a className="btn alt sm" href={`/team/${s.slug}/post.jpg`} download={`${s.slug}-post.jpg`} title="Post-Grafik 1:1 für Instagram/Facebook">Post-Bild</a>
              </div>
            </div>
            {statsOpen === s.slug && <div className="ts-orders">
              <div className="ts-kpis">
                <div><small>Bestellungen</small><b>{s.stats.tot.orders}</b>{s.stats.tot.paid > 0 && <span>{s.stats.tot.paid} per PayPal bezahlt</span>}</div>
                <div><small>Teile</small><b>{s.stats.tot.pieces}</b></div>
                <div><small>Umsatz netto</small><b>{money(s.stats.tot.revenue)}</b></div>
                <div><small>Marge ca.</small><b>{money(s.stats.tot.margin)}</b><span>{s.stats.tot.revenue > 0 ? `${Math.round((s.stats.tot.margin / s.stats.tot.revenue) * 1000) / 10} %` : ''}</span></div>
              </div>
              <table className="atable"><thead><tr><th>Woche</th><th>Bestellungen</th><th>Teile</th><th>Umsatz netto</th><th>Marge ca.</th></tr></thead>
                <tbody>{s.stats.rows.map((r) => <tr key={r.week}><td>{r.week}</td><td>{r.orders}{r.paid ? ` (${r.paid} bezahlt)` : ''}</td><td>{r.pieces}</td><td>{money(r.revenue)}</td><td>{money(r.margin)}</td></tr>)}</tbody></table>
              {s.stats.top.length > 0 && <><h3 style={{ margin: '16px 0 6px', fontSize: 15 }}>Top-{s.motifs?.length ? 'Motive' : 'Logos'}</h3>
                <ol className="ts-top">{s.stats.top.map((m) => <li key={m.name}><span>{m.name}</span><b>{m.qty} Stk.</b></li>)}</ol></>}
              <p className="muted" style={{ fontSize: 12 }}>Marge = Verkaufspreis − EK − geschätzte Druckkosten (Admin → Veredelung); Versand nicht eingerechnet.{s.stats.missingEk ? ` Bei ${s.stats.missingEk} Teilen fehlt der EK.` : ''}</p>
            </div>}
            {open === s.slug && <div className="ts-orders">
              <table className="atable"><thead><tr>{s.motifs?.length || s.logos?.length ? <th>{s.motifs?.length ? 'Motiv' : 'Logo'}</th> : null}<th>Artikel</th><th>Farbe</th><th>Größen</th><th>Gesamt</th></tr></thead>
                <tbody>{s.orders.items.map((i) => <tr key={i.sku + i.color + (i.motif ?? '')}>{s.motifs?.length || s.logos?.length ? <td><b>{i.motif ?? '–'}</b></td> : null}<td><b>{i.sku}</b> {i.name}</td><td>{i.color}</td><td>{Object.entries(i.sizes).map(([z, n]) => `${z}: ${n}`).join(' · ')}</td><td><b>{i.total}</b></td></tr>)}</tbody></table>
              <h3 style={{ margin: '16px 0 6px', fontSize: 15 }}>Bestellungen der Mitglieder</h3>
              <table className="atable"><thead><tr><th>Anfrage</th><th>Name</th><th>Teile</th><th>Name / Nummer</th><th>Status</th></tr></thead>
                <tbody>{s.orders.people.map((p) => <tr key={p.no}><td><a className="alink" href={`/admin/anfrage/${p.no}`}>{p.no}</a></td><td>{p.name}<div className="muted" style={{ fontSize: 12 }}>{p.email}</div></td><td>{p.pieces}</td><td>{p.personal.join(', ') || '–'}</td><td>{p.status}</td></tr>)}</tbody></table>
              <div className="deco-row" style={{ marginTop: 10 }}><button className="btn alt sm" onClick={() => csv(s)}>Als Excel/CSV herunterladen</button><a className="btn sm" href={`/api/admin/teamshops/druck?slug=${encodeURIComponent(s.slug)}`}>Druckpaket (ZIP) für die Druckerei</a></div>
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
            <div className="deco-row">{edit.logoId && <img src={`/api/upload/${edit.logoId}?w=320`} alt="" style={{ height: 48, maxWidth: 120, objectFit: 'contain' }} />}<label className="btn alt sm upl">{edit.logoId ? 'Logo ändern' : 'Logo hochladen'}<input type="file" hidden accept=".png,.jpg,.jpeg,.svg,.webp,.pdf,.ai,.eps" onChange={(e) => upload(e.target.files?.[0])} /></label></div>
            <label>Weitere Logos zur Auswahl ({edit.logos?.length ?? 0}) <span className="muted" style={{ fontWeight: 400 }}>– z. B. Schriftzug, Jugend, Abteilung; Mitglieder wählen eines</span></label>
            {(edit.logos?.length ?? 0) > 0 && <div className="ts-motifs">
              {edit.logos!.map((m, i) => (
                <div key={m.id} className="ts-motif">
                  <img src={`/api/upload/${m.id}?w=320`} alt="" loading="lazy" />
                  <input value={m.name} onChange={(e) => setEdit({ ...edit, logos: edit.logos!.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} aria-label="Name des Logos" />
                  <div className="ts-motif-a"><span /><button type="button" className="linkbtn err" onClick={() => setEdit({ ...edit, logos: edit.logos!.filter((_, k) => k !== i) })}>entfernen</button></div>
                </div>
              ))}
            </div>}
            <div className="ts-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadMotifs(e.dataTransfer.files, 'logos'); }}>
              <label className="btn alt sm upl">+ Weiteres Logo<input type="file" hidden multiple accept="image/png,image/jpeg,image/svg+xml,image/webp,.png,.jpg,.jpeg,.svg,.webp" onChange={(e) => { uploadMotifs(e.target.files, 'logos'); e.target.value = ''; }} /></label>
              <span className="muted">{edit.logoId ? 'Das Vereinslogo oben ist die Vorauswahl.' : 'Bitte zuerst oben das Haupt-Logo hochladen.'}</span>
            </div>
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
            <fieldset className="ts-rights"><legend>Nutzungsrechte {(edit.motifs?.length || edit.logoId) ? <span className="muted">– Freigabe des Rechteinhabers für Motive/Logos</span> : null}</legend>
              <div className="two">
                <div><label>Rechteinhaber</label><input value={edit.rights?.holder ?? ''} onChange={(e) => setEdit({ ...edit, rights: { ...(edit.rights ?? {}), holder: e.target.value } })} placeholder="z. B. Künstler / Verein / Agentur" /></div>
                <div><label>Freigabe vom</label><input type="date" value={edit.rights?.date ?? ''} onChange={(e) => setEdit({ ...edit, rights: { ...(edit.rights ?? {}), date: e.target.value } })} /></div>
              </div>
              <div className="deco-row">
                {edit.rights?.docId ? <a className="alink" href={`/api/upload/${edit.rights.docId}?download`} target="_blank">📄 {edit.rights.docName ?? 'Freigabe'}</a> : <span className="muted" style={{ fontSize: 13 }}>Noch kein Dokument</span>}
                <label className="btn alt sm upl">{edit.rights?.docId ? 'Dokument ersetzen' : 'Freigabe hochladen (PDF/Bild)'}<input type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const fd = new FormData(); fd.append('file', f); const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json().catch(() => ({})); if (r.ok) setEdit((x) => ({ ...x!, rights: { ...(x!.rights ?? {}), docId: d.id, docName: d.name } })); else setMsg(d.error ?? 'Upload fehlgeschlagen'); e.target.value = ''; }} /></label>
              </div>
              <label>Notiz</label><input value={edit.rights?.note ?? ''} onChange={(e) => setEdit({ ...edit, rights: { ...(edit.rights ?? {}), note: e.target.value } })} placeholder="z. B. Freigabe per WhatsApp, Umsatzbeteiligung 10 %" />
            </fieldset>
            <fieldset className="ts-rights"><legend>Sichtbarkeit</legend>
              <label className="ds-check"><input type="checkbox" checked={!!edit.indexed} onChange={(e) => setEdit({ ...edit, indexed: e.target.checked })} /> Bei Google auffindbar{' '}<span className="muted">(für öffentliche Shops wie Politik Insider; Vereinsshops besser aus lassen – dann nur per Link erreichbar)</span></label>
            </fieldset>
            <fieldset className="ts-rights"><legend>Bestellung &amp; Versand</legend>
              <label className="ds-check"><input type="checkbox" checked={!!edit.direct} onChange={(e) => setEdit({ ...edit, direct: e.target.checked })} /> Einzelversand an jeden Käufer – sofort bestellen{' '}<span className="muted">(statt Angebot &amp; Sammellieferung; nur mit Festpreis, Bezahlung per PayPal falls eingerichtet)</span></label>
              {edit.direct && <div className="two">
                <div><label>Versandpauschale brutto je Bestellung</label><input inputMode="decimal" value={edit.shipGross ?? ''} onChange={(e) => setEdit({ ...edit, shipGross: (e.target.value as unknown as number) })} placeholder="z. B. 4,90" /></div>
                <div><label>Versandkostenfrei ab (brutto, optional)</label><input inputMode="decimal" value={edit.freeFromGross ?? ''} onChange={(e) => setEdit({ ...edit, freeFromGross: (e.target.value as unknown as number) })} placeholder="z. B. 80" /></div>
              </div>}
              {edit.direct && !edit.price && <p className="err" style={{ fontSize: 13, margin: '6px 0 0' }}>Einzelversand braucht einen Festpreis (unten).</p>}
            </fieldset>
            <div className="two">
              <div><label>Rückendruck-Option: Aufpreis netto (optional)</label><input inputMode="decimal" value={edit.backPrice ?? ''} onChange={(e) => setEdit({ ...edit, backPrice: (e.target.value as unknown as number) })} placeholder="z. B. 4,20" /></div>
              <div><label>&nbsp;</label><small className="muted">Nur mit Festpreis: Kunden können das Shop-Logo (oben) zusätzlich groß auf den Rücken drucken lassen.</small></div>
            </div>
            <label>Motive zur Auswahl ({edit.motifs?.length ?? 0}) <span className="muted" style={{ fontWeight: 400 }}>– leer = normaler Team-Shop mit festem Logo</span></label>
            <div className="ts-motifs">
              {(edit.motifs ?? []).map((m, i) => (
                <div key={m.id} className="ts-motif">
                  <img src={`/api/upload/${m.id}?w=320`} alt="" loading="lazy" />
                  <input value={m.name} onChange={(e) => setMotif(i, { name: e.target.value })} aria-label="Name des Motivs" />
                  <div className="ts-motif-a"><button type="button" className="linkbtn" onClick={() => moveMotif(i, -1)} aria-label="nach vorn">◀</button><button type="button" className="linkbtn" onClick={() => moveMotif(i, 1)} aria-label="nach hinten">▶</button><button type="button" className="linkbtn err" onClick={() => setEdit({ ...edit, motifs: edit.motifs!.filter((_, k) => k !== i) })}>entfernen</button></div>
                </div>
              ))}
            </div>
            <div className={`ts-drop ${drag ? 'on' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); uploadMotifs(e.dataTransfer.files); }}>
              <label className="btn alt sm upl">{upBusy ? `Lädt hoch … (noch ${upBusy})` : '+ Motive auswählen'}<input type="file" hidden multiple accept="image/png,image/jpeg,image/svg+xml,image/webp,.png,.jpg,.jpeg,.svg,.webp" onChange={(e) => { uploadMotifs(e.target.files); e.target.value = ''; }} /></label>
              <span className="muted">oder PNG/JPG/SVG-Dateien hierher ziehen – mehrere auf einmal möglich</span>
            </div>
            {msg && <p className="err" style={{ fontSize: 13, margin: '4px 0' }}>{msg}</p>}
            <div className="two">
              <div><label>Festpreis je Teil inkl. Veredelung (netto, optional)</label><input inputMode="decimal" value={edit.price ?? ''} onChange={(e) => setEdit({ ...edit, price: (e.target.value as unknown as number) })} placeholder="z. B. 20,92" /></div>
              <div><label>= brutto inkl. 19 % MwSt.</label><input disabled value={(() => { const n = Number(String(edit.price ?? '').replace(',', '.')); return n > 0 ? `${(Math.round(n * 119) / 100).toFixed(2).replace('.', ',')} €` : '–'; })()} /></div>
            </div>
            <label>Artikel ({edit.items?.length ?? 0})</label>
            <PickedStrip items={products} value={edit.items ?? []} onOpen={() => setPicker(true)} onRemove={(id) => setEdit({ ...edit, items: edit.items!.filter((x) => x !== id) })} />
            {picker && <ArticlePicker items={products} groups={groups} value={edit.items ?? []} onChange={(ids) => setEdit((e) => ({ ...e!, items: ids }))} title={`Artikel für ${edit.name || 'den Team-Shop'}`} onClose={() => setPicker(false)} />}
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
