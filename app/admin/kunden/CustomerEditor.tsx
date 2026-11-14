'use client';
import { useState } from 'react';
import type { AccessRequest, Customer as Cust } from '@/lib/store';
type Customer = Omit<Cust, 'pw'> & { hasPw?: boolean; _orig?: string };

type P = { sku: string; name: string; brand: string };
const gen = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

export default function CustomerEditor({ initial, envCodes, products, defaultMarkup, defaultTiers, requests: req0, mail }: { mail?: boolean; requests: AccessRequest[]; initial: Customer[]; envCodes: { code: string; name: string }[]; products: P[]; defaultMarkup: number; defaultTiers: string }) {
  const [list, setList] = useState<Customer[]>(initial);
  const [open, setOpen] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState('');
  const [requests, setRequests] = useState(req0);
  async function doneReq(id: string) { await fetch('/api/admin/zugangsanfragen', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, done: true }) }); setRequests((r) => r.filter((x) => x.id !== id)); }
  function createFrom(r: AccessRequest) {
    const c: Customer = { code: gen(), name: r.company || r.name, email: r.email || null, markup: null, skus: [], exclusive: false, active: true, note: `${r.name} · ${r.email}${r.phone ? ' · ' + r.phone : ''}${r.type ? ' · ' + r.type : ''}${r.kind === 'preis' ? `\nPreisanfrage: ${[r.category, r.qty && r.qty + ' Stk.', r.deco, r.sample && 'Muster'].filter(Boolean).join(' · ')}` : ''}${r.message ? '\n' + r.message : ''}` };
    setList((l) => [c, ...l]); setOpen(0); setDirty(true); doneReq(r.id);
    setMsg({ ok: true, t: `Kunde angelegt (Code ${c.code}) – jetzt speichern und Einladung an ${r.email} schicken.` });
  }

  const upd = (k: number, patch: Partial<Customer>) => { setList((l) => l.map((c, n) => (n === k ? { ...c, ...patch } : c))); setDirty(true); };
  const add = () => { setList((l) => [{ code: gen(), name: '', markup: null, skus: [], exclusive: false, active: true }, ...l]); setOpen(0); setDirty(true); };
  const del = (k: number) => { if (confirm('Kunde und Code wirklich löschen? Der Code funktioniert danach nicht mehr.')) { setList((l) => l.filter((_, n) => n !== k)); setOpen(null); setDirty(true); } };

  async function save() {
    setBusy(true); setMsg(null);
    const r = await fetch('/api/admin/kunden', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customers: list }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setDirty(false); setList((l) => l.map((c) => ({ ...c, _orig: c.code, pending: c.pending && c.active === false }))); setMsg({ ok: true, t: d.activated ? `Gespeichert – ${d.activated} Konto freigeschaltet${d.mailed ? ', Kunde per E-Mail benachrichtigt' : ' (keine Mail: SMTP fehlt – bitte Kunde selbst informieren)'}.` : 'Gespeichert – Änderungen gelten sofort.' }); } else setMsg({ ok: false, t: d.error ?? 'Fehler' });
  }
  async function invite(c: Customer) {
    if (dirty) { setMsg({ ok: false, t: 'Bitte zuerst speichern, dann die Einladung senden.' }); return; }
    setMsg(null);
    const r = await fetch('/api/admin/kunden/einladung', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c.code }) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? { ok: true, t: `Einladung an ${c.email} gesendet – der Kunde legt sein Passwort selbst fest.` } : { ok: false, t: d.error ?? 'Senden fehlgeschlagen' });
  }
  async function uploadLogo(k: number, f?: File | null) {
    if (!f) return;
    const fd = new FormData(); fd.append('file', f);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await r.json().catch(() => ({}));
    if (r.ok) upd(k, { logoId: d.id, logoName: d.name }); else alert(d.error ?? 'Upload fehlgeschlagen');
  }
  const pname = (sku: string) => products.find((p) => p.sku.toUpperCase() === sku)?.name ?? '(nicht im Katalog)';

  return (
    <>
      <div className="admin-actions" style={{ marginTop: 0 }}>
        <button className="btn" onClick={add}>+ Neuer Kunde / Code</button>
        <button className="btn alt" disabled={!dirty || busy} onClick={save}>{busy ? 'Speichert …' : dirty ? 'Änderungen speichern' : 'Gespeichert'}</button>
        {msg && <span className={msg.ok ? 'ok' : 'err'}>{msg.t}</span>}
      </div>

      {requests.length > 0 && (
        <div className="box" style={{ marginBottom: 14, borderLeft: '4px solid var(--accent)' }}>
          <strong>Offene Anfragen ({requests.length})</strong>
          {requests.map((r) => (
            <div key={r.id} className="req">
              <div><b>{r.company || r.name}</b> <span className="muted">· {r.name} · <a className="alink" href={`mailto:${r.email}`}>{r.email}</a>{r.phone && ` · ${r.phone}`}{r.type && ` · ${r.type}`} · {new Date(r.date).toLocaleDateString('de-DE')}</span>{r.kind === 'preis' && <div style={{ fontSize: 13, marginTop: 3 }}><span className="st st-angebot">Preisanfrage</span> {[r.category, r.qty && `${r.qty} Stk.`, r.deco, r.sample && 'Muster gewünscht'].filter(Boolean).join(' · ')}{r.logoId && <> · <a className="alink" href={`/api/upload/${r.logoId}?download`}>Logo ↓</a></>}</div>}{r.message && <div className="muted" style={{ fontSize: 13 }}>{r.message}</div>}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 'none' }}>
                <button className="btn" style={{ height: 38 }} onClick={() => createFrom(r)}>Als Kunde anlegen</button>
                <button className="linkbtn" onClick={() => doneReq(r.id)}>ablehnen</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!list.length && <div className="box muted">Noch keine Kunden angelegt. Mit „Neuer Kunde / Code“ legen Sie den ersten an.</div>}
      <div className="cust-list">
        {list.map((c, k) => (
          <div key={k} className={`box cust ${c.active === false ? 'off' : ''}`}>
            <div className="cust-head" onClick={() => setOpen(open === k ? null : k)}>
              <code className="code">{c.code || '—'}</code>
              <strong>{c.name || <span className="muted">Neuer Kunde</span>}</strong>
              <span className="muted">{c.markup != null ? `${c.markup} % Aufschlag` : `Standard (${defaultMarkup} %)`}</span>
              {!!c.skus?.length && <span className="muted">· {c.skus.length} Artikel{c.exclusive ? ' (exklusiv)' : ''}</span>}
              {c.logoId && <span className="muted">· Logo</span>}
              {c.email && <span className="muted">· {c.hasPw ? '🔑 Login aktiv' : '✉ Login offen'}</span>}
              {c.pending ? <span className="st st-angebot">neu registriert – wartet auf Freigabe</span> : c.active === false && <span className="st st-abgelehnt">gesperrt</span>}
              <span style={{ marginLeft: 'auto' }} className="muted">{open === k ? '▲' : '▼'}</span>
            </div>
            {open === k && (
              <div className="form cust-body">
                <div className="two">
                  <div><label>Kunde / Verein *</label><input value={c.name} onChange={(e) => upd(k, { name: e.target.value })} placeholder="z. B. SV Musterstadt" /></div>
                  <div><label>Zugangscode *</label>
                    <div style={{ display: 'flex', gap: 6 }}><input value={c.code} onChange={(e) => upd(k, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })} style={{ fontFamily: 'ui-monospace,monospace', letterSpacing: 1 }} /><button type="button" className="btn alt" style={{ height: 42 }} onClick={() => upd(k, { code: gen() })}>neu</button></div>
                  </div>
                </div>
                <div className="two">
                  <div><label>E-Mail für Login (optional)</label><input type="email" value={c.email ?? ''} onChange={(e) => upd(k, { email: e.target.value.trim() || null, hasPw: false })} placeholder="kunde@firma.de" /></div>
                  <div><label>Login-Status</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                      <span className="muted" style={{ fontSize: 14 }}>{!c.email ? 'Nur Zugangscode' : c.hasPw ? '🔑 Passwort gesetzt' : '✉ Passwort noch nicht festgelegt'}</span>
                      {c.email && <button type="button" className="btn alt" style={{ height: 36 }} disabled={!mail} title={mail ? '' : 'SMTP in der .env eintragen, damit E-Mails rausgehen'} onClick={() => invite(c)}>{c.hasPw ? 'Passwort-Link senden' : 'Einladung senden'}</button>}
                    </div>
                  </div>
                </div>
                <div className="two">
                  <div><label>Aufschlag in % (leer = Standard {defaultMarkup} %)</label><input inputMode="decimal" value={c.markup ?? ''} onChange={(e) => upd(k, { markup: e.target.value === '' ? null : Number(e.target.value.replace(',', '.')) })} /></div>
                  <div><label>Status</label>
                    <label style={{ display: 'flex', gap: 8, fontWeight: 400, margin: '10px 0 0' }}><input type="checkbox" style={{ width: 'auto' }} checked={c.active !== false} onChange={(e) => upd(k, { active: e.target.checked })} /> {c.pending ? 'Freischalten (Kunde wird per E-Mail informiert)' : 'Konto aktiv'}</label>
                  </div>
                </div>

                <label>Staffelrabatt (leer = Standard {defaultTiers || 'keiner'}, „-“ = keiner)</label>
                <input value={c.tiers ?? ''} onChange={(e) => upd(k, { tiers: e.target.value })} placeholder="z. B. 10:5,50:10,100:15  →  ab 10 Stk. −5 %, ab 50 −10 %, ab 100 −15 %" />

                <label>Kollektion (Artikel, die der Kunde zuerst sieht)</label>
                <div className="chips" style={{ marginTop: 4 }}>
                  {(c.skus ?? []).map((s) => <span key={s} className="chip">{s} – {pname(s)} <button type="button" className="x" style={{ fontSize: 15 }} onClick={() => upd(k, { skus: c.skus!.filter((x) => x !== s) })}>×</button></span>)}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input list="all-products" value={pick} onChange={(e) => setPick(e.target.value)} placeholder="Artikelnummer oder Name eingeben …" />
                  <button type="button" className="btn alt" style={{ height: 42 }} onClick={() => {
                    const q = pick.trim().toUpperCase().split(' ')[0];
                    const p = products.find((x) => x.sku.toUpperCase() === q) ?? products.find((x) => `${x.sku} ${x.name}`.toUpperCase().includes(pick.trim().toUpperCase()));
                    if (p && !(c.skus ?? []).includes(p.sku.toUpperCase())) upd(k, { skus: [...(c.skus ?? []), p.sku.toUpperCase()] });
                    setPick('');
                  }}>hinzufügen</button>
                </div>
                <label style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" style={{ width: 'auto' }} checked={!!c.exclusive} onChange={(e) => upd(k, { exclusive: e.target.checked })} /> Nur diese Kollektion anzeigen (restlicher Katalog ausgeblendet)</label>

                <label>Hinterlegtes Logo</label>
                {c.logoId ? (
                  <div className="logo-file">
                    {/\.(png|jpe?g|webp|svg)$/i.test(c.logoName ?? '') ? <img src={`/api/upload/${c.logoId}`} alt="" /> : <span className="file-ico">{c.logoName?.split('.').pop()?.toUpperCase()}</span>}
                    <span>{c.logoName}</span>
                    <button type="button" className="linkbtn" onClick={() => upd(k, { logoId: null, logoName: null })}>entfernen</button>
                  </div>
                ) : <label className="btn alt upl" style={{ width: 'fit-content' }}>Logo hochladen<input type="file" hidden accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.ai,.eps" onChange={(e) => uploadLogo(k, e.target.files?.[0])} /></label>}

                <label>Interne Notiz</label>
                <textarea value={c.note ?? ''} onChange={(e) => upd(k, { note: e.target.value })} placeholder="nur für Sie sichtbar" />
                <div className="admin-actions">
                  <button type="button" className="btn alt" onClick={() => navigator.clipboard.writeText(`Guten Tag,\n\nIhr persönlicher Zugang zu unserem Textil-Shop ist freigeschaltet:\n\n${window.location.origin}\nZugangscode: ${c.code}${c.email ? `\nOder Anmeldung mit E-Mail (${c.email}) und Passwort` : ''}\n\nDort finden Sie Ihre Konditionen${c.skus?.length ? ' und Ihre eigene Kollektion' : ''}, können Logos hochladen und erhalten Ihr Angebot innerhalb von 24 Stunden.\n\nMit freundlichen Grüßen\nEuro-Trade`)}>Einladungstext kopieren</button>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="linkbtn err" onClick={() => del(k)}>Kunde löschen</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <datalist id="all-products">{products.map((p) => <option key={p.sku} value={`${p.sku} ${p.name}`}>{p.brand}</option>)}</datalist>

      {envCodes.length > 0 && <>
        <h2>Codes aus der .env-Datei</h2>
        <p className="muted" style={{ marginTop: -6 }}>Diese Codes stehen in <code>ACCESS_CODES</code> auf dem Server und gelten mit Standard-Einstellungen (der Shop ist auch ohne Code öffentlich). Legen Sie einen Kunden mit demselben Code hier an, um Aufschlag, Kollektion und Logo festzulegen.</p>
        <div className="chips">{envCodes.map((c) => <span key={c.code} className="chip"><code>{c.code}</code> {c.name !== c.code ? `– ${c.name}` : ''}</span>)}</div>
      </>}
    </>
  );
}
