'use client';
import ArticlePicker, { PickedStrip, type PickGroup, type PickItem } from '@/components/ArticlePicker';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AccessRequest, Customer as Cust } from '@/lib/store';
import { parseTiers } from '@/lib/tiers';

type Customer = Omit<Cust, 'pw'> & { hasPw?: boolean; _orig?: string };
type P = PickItem;
type Props = { initial: Customer[]; envCodes: { code: string; name: string }[]; products: P[]; groups: PickGroup[]; defaultMarkup: number; defaultTiers: string; requests: AccessRequest[]; mail?: boolean };

const gen = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
const blank = (): Customer => ({ code: gen(), name: '', email: null, markup: null, tiers: null, skus: [], exclusive: false, active: true, note: '' });
type Filter = 'alle' | 'aktiv' | 'gesperrt' | 'ohne-login';

export default function CustomerManager({ initial, envCodes, products, groups, defaultMarkup, defaultTiers, requests: req0, mail }: Props) {
  const [list, setList] = useState<Customer[]>(initial);
  const [requests, setRequests] = useState(req0);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('alle');
  const [edit, setEdit] = useState<{ c: Customer; isNew: boolean; reqId?: string } | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; t: string } | null>(null);
  const say = (ok: boolean, t: string) => { setToast({ ok, t }); setTimeout(() => setToast(null), 3500); };

  const counts = useMemo(() => ({
    alle: list.length,
    aktiv: list.filter((c) => c.active !== false).length,
    gesperrt: list.filter((c) => c.active === false).length,
    'ohne-login': list.filter((c) => !c.email).length,
  }), [list]);
  const shown = list.filter((c) => {
    if (filter === 'aktiv' && c.active === false) return false;
    if (filter === 'gesperrt' && c.active !== false) return false;
    if (filter === 'ohne-login' && c.email) return false;
    const s = q.trim().toLowerCase();
    return !s || [c.name, c.email, c.code, c.note].some((x) => String(x ?? '').toLowerCase().includes(s));
  });

  async function toggle(c: Customer) {
    const active = c.active === false;
    setList((l) => l.map((x) => (x.code === c.code ? { ...x, active } : x)));
    const r = await fetch('/api/admin/kunden/einzeln', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c.code, active }) });
    if (r.ok) say(true, `${c.name} ist jetzt ${active ? 'aktiv' : 'gesperrt'}.`);
    else { setList((l) => l.map((x) => (x.code === c.code ? { ...x, active: !active } : x))); say(false, 'Konnte Status nicht ändern.'); }
  }
  async function doneReq(id: string) {
    await fetch('/api/admin/zugangsanfragen', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, done: true }) });
    setRequests((r) => r.filter((x) => x.id !== id));
  }
  function fromRequest(r: AccessRequest) {
    const extra = r.kind === 'preis' ? `\nPreisanfrage: ${[r.category, r.qty && r.qty + ' Stk.', r.deco, r.sample && 'Muster'].filter(Boolean).join(' · ')}` : '';
    setEdit({ isNew: true, reqId: r.id, c: { ...blank(), name: r.company || r.name, email: r.email || null, note: `${r.name}${r.phone ? ' · ' + r.phone : ''}${r.type ? ' · ' + r.type : ''}${extra}${r.message ? '\n' + r.message : ''}` } });
  }
  function saved(c: Customer, isNew: boolean, orig?: string, reqId?: string) {
    setList((l) => (isNew ? [c, ...l] : l.map((x) => (x.code === orig ? c : x))));
    if (reqId) doneReq(reqId);
    setEdit(null);
    say(true, isNew ? `${c.name} angelegt.` : `${c.name} gespeichert.`);
  }
  function removed(code: string, name: string) {
    setList((l) => l.filter((x) => x.code !== code));
    setEdit(null);
    say(true, `${name} gelöscht.`);
  }

  return (
    <div className="cm">
      <div className="cm-head">
        <div>
          <h1>Kunden</h1>
          <p className="muted">Jeder Kunde meldet sich mit E-Mail + Passwort oder mit seinem Zugangscode an. Standard-Aufschlag: {defaultMarkup} %.</p>
        </div>
        <button className="btn cm-new" onClick={() => setEdit({ c: blank(), isNew: true })}>+ Neuer Kunde</button>
      </div>

      {requests.length > 0 && (
        <div className="cm-requests">
          <div className="cm-sec-title">📨 Offene Zugangs- & Preisanfragen <span className="nav-badge">{requests.length}</span></div>
          {requests.map((r) => (
            <div key={r.id} className="cm-req">
              <div className="cm-req-info">
                <b>{r.company || r.name}</b>
                <span className="muted">{r.name} · <a className="alink" href={`mailto:${r.email}`}>{r.email}</a>{r.phone && ` · ${r.phone}`}{r.type && ` · ${r.type}`} · {new Date(r.date).toLocaleDateString('de-DE')}</span>
                {r.kind === 'preis' && <span><span className="st st-angebot">Preisanfrage</span> {[r.category, r.qty && `${r.qty} Stk.`, r.deco, r.sample && 'Muster gewünscht'].filter(Boolean).join(' · ')}{r.logoId && <> · <a className="alink" href={`/api/upload/${r.logoId}?download`}>Logo ↓</a></>}</span>}
                {r.message && <span className="muted cm-msg">{r.message}</span>}
              </div>
              <div className="cm-req-actions">
                <button className="btn" onClick={() => fromRequest(r)}>Als Kunde anlegen</button>
                <button className="btn alt" onClick={() => doneReq(r.id)}>Erledigt</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cm-toolbar">
        <input className="cm-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen nach Name, E-Mail, Code …" aria-label="Kunden suchen" />
        <div className="cm-filters" role="tablist">
          {(['alle', 'aktiv', 'gesperrt', 'ohne-login'] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
              {{ alle: 'Alle', aktiv: 'Aktiv', gesperrt: 'Gesperrt', 'ohne-login': 'Ohne E-Mail-Login' }[f]} <span>{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {!list.length ? (
        <div className="cm-empty"><b>Noch keine Kunden.</b><p className="muted">Legen Sie den ersten Kunden an – oder warten Sie auf Registrierungen, die oben erscheinen.</p><button className="btn" onClick={() => setEdit({ c: blank(), isNew: true })}>+ Neuer Kunde</button></div>
      ) : !shown.length ? <div className="cm-empty muted">Keine Kunden für diese Suche.</div> : (
        <div className="cm-table" role="table">
          <div className="cm-row cm-th" role="row"><span>Status</span><span>Kunde</span><span>Anmeldung</span><span>Konditionen</span><span /></div>
          {shown.map((c) => (
            <div key={c.code} className={`cm-row ${c.active === false ? 'off' : ''}`} role="row">
              <span className="cm-status">
                <button type="button" className={`switch ${c.active !== false ? 'on' : ''}`} role="switch" aria-checked={c.active !== false} aria-label={`${c.name} ${c.active !== false ? 'sperren' : 'freischalten'}`} onClick={() => toggle(c)}><i /></button>
                <span className={c.active !== false ? 'ok' : 'muted'}>{c.active !== false ? 'Aktiv' : 'Gesperrt'}</span>
              </span>
              <span className="cm-who" onClick={() => setEdit({ c, isNew: false })}>
                <b>{c.name}</b>
                <span className="muted">{c.email ?? 'keine E-Mail hinterlegt'}</span>
              </span>
              <span className="cm-login">
                <code className="code">{c.code}</code>
                {c.email ? (c.hasPw ? <span className="tag tag-ok">🔑 Passwort aktiv</span> : <span className="tag tag-warn">✉ Passwort offen</span>) : <span className="tag">nur Code</span>}
              </span>
              <span className="cm-cond">
                <span>{c.markup != null ? `${c.markup} % Aufschlag` : `Standard (${defaultMarkup} %)`}</span>
                <span className="muted">{c.tiers === '-' ? 'keine Staffel' : c.tiers ? `Staffel ${c.tiers}` : 'Standard-Staffel'}{c.skus?.length ? ` · ${c.skus.length} Artikel${c.exclusive ? ' (exklusiv)' : ''}` : ''}{c.logoId ? ' · Logo' : ''}</span>
              </span>
              <span className="cm-edit"><button className="btn alt" onClick={() => setEdit({ c, isNew: false })}>Bearbeiten</button></span>
            </div>
          ))}
        </div>
      )}

      {envCodes.length > 0 && (
        <details className="cm-env">
          <summary>Codes aus der .env-Datei ({envCodes.length})</summary>
          <p className="muted">Diese Codes stehen in <code>ACCESS_CODES</code> auf dem Server und gelten mit Standard-Konditionen (der Shop ist auch ohne Code öffentlich – Codes dienen für Kundenkonditionen). Legen Sie einen Kunden mit demselben Code an, um Konditionen festzulegen.</p>
          <div className="chips">{envCodes.map((c) => <span key={c.code} className="chip"><code>{c.code}</code> {c.name !== c.code ? `– ${c.name}` : ''}</span>)}</div>
        </details>
      )}

      {edit && <Drawer key={edit.c._orig ?? edit.c.code} state={edit} products={products} groups={groups} defaultMarkup={defaultMarkup} defaultTiers={defaultTiers} mail={mail}
        onClose={() => setEdit(null)} onSaved={saved} onRemoved={removed} say={say} />}
      {toast && <div className={`cm-toast ${toast.ok ? 'ok' : 'err'}`} role="status">{toast.t}</div>}
    </div>
  );
}

/* ---------- Bearbeiten-Panel ---------- */
function Drawer({ state, products, groups, defaultMarkup, defaultTiers, mail, onClose, onSaved, onRemoved, say }: {
  state: { c: Customer; isNew: boolean; reqId?: string }; products: P[]; groups: PickGroup[]; defaultMarkup: number; defaultTiers: string; mail?: boolean;
  onClose: () => void; onSaved: (c: Customer, isNew: boolean, orig?: string, reqId?: string) => void; onRemoved: (code: string, name: string) => void; say: (ok: boolean, t: string) => void;
}) {
  const { isNew, reqId } = state;
  const orig = state.c._orig ?? state.c.code;
  const [c, setC] = useState<Customer>(state.c);
  const [dirty, setDirty] = useState(isNew);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const upd = (p: Partial<Customer>) => { setC((x) => ({ ...x, ...p })); setDirty(true); setErr(''); };

  // Konditionen-Modus
  const markupMode = c.markup == null ? 'std' : 'own';
  const tierMode = c.tiers === '-' ? 'none' : c.tiers ? 'own' : 'std';
  // Zeilen roh aus dem String lesen (nicht filtern – sonst verschwindet eine Zeile beim Tippen)
  const tierRows = c.tiers && c.tiers !== '-' ? c.tiers.split(',').map((x) => { const [m, p] = x.split(':'); return { min: Number(m) || 0, pct: Number(p) || 0 }; }) : [];
  const writeRows = (rows: { min: number; pct: number }[]) => upd({ tiers: rows.length ? rows.map((r) => `${r.min}:${r.pct}`).join(',') : null });
  const editRow = (k: number, p: Partial<{ min: number; pct: number }>) => writeRows(tierRows.map((r, n) => (n === k ? { ...r, ...p } : r)));

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function close() { if (!dirty || confirm('Änderungen verwerfen?')) onClose(); }

  async function save() {
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/kunden/einzeln', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: c, orig: isNew ? null : orig }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) onSaved(d.customer, isNew, orig, reqId); else setErr(d.error ?? 'Speichern fehlgeschlagen.');
  }
  async function remove() {
    if (!confirm(`${c.name || 'Kunde'} wirklich löschen? Code und Login funktionieren danach nicht mehr.`)) return;
    const r = await fetch('/api/admin/kunden/einzeln', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: orig }) });
    if (r.ok) onRemoved(orig, c.name); else say(false, 'Löschen fehlgeschlagen.');
  }
  async function invite() {
    const r = await fetch('/api/admin/kunden/einladung', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c.code }) });
    const d = await r.json().catch(() => ({}));
    say(r.ok, r.ok ? `E-Mail an ${c.email} gesendet – der Kunde legt sein Passwort selbst fest.` : d.error ?? 'Senden fehlgeschlagen');
  }
  async function uploadLogo(f?: File | null) {
    if (!f) return;
    const fd = new FormData(); fd.append('file', f);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await r.json().catch(() => ({}));
    if (r.ok) upd({ logoId: d.id, logoName: d.name }); else setErr(d.error ?? 'Upload fehlgeschlagen');
  }
  // Kollektion wird als Art.-Nr. gespeichert – die Auswahl arbeitet mit Artikel-IDs
  const [picker, setPicker] = useState(false);
  const bySku = new Map(products.map((p) => [p.sku.toUpperCase(), p.id]));
  const byPid = new Map(products.map((p) => [p.id, p.sku.toUpperCase()]));
  const skuIds = (c.skus ?? []).map((s) => bySku.get(s) ?? s);
  const setSkuIds = (ids: string[]) => upd({ skus: ids.map((id) => byPid.get(id) ?? id.toUpperCase()) });
  const inviteText = () => `Guten Tag,\n\nIhr persönlicher Zugang zu unserem Textil-Shop ist freigeschaltet:\n\n${window.location.origin}/zugang\n${c.email ? `Anmeldung mit Ihrer E-Mail-Adresse (${c.email}) – das Passwort legen Sie über „Passwort vergessen“ selbst fest.\nOder mit Zugangscode: ${c.code}` : `Zugangscode: ${c.code}`}\n\nDort finden Sie Ihre Konditionen${c.skus?.length ? ' und Ihre eigene Kollektion' : ''}, können Logos hochladen und erhalten Ihr Angebot innerhalb von 24 Stunden.\n\nMit freundlichen Grüßen\nEuro-Trade`;

  // Portal an <body>: unabhängig von Layout/Transform der Seite immer bildschirmfüllend
  return createPortal(
    <div className="cmd-wrap" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <aside className="cmd" role="dialog" aria-modal="true" aria-label={isNew ? 'Neuer Kunde' : `${c.name} bearbeiten`}>
        <header className="cmd-head">
          <div>
            <div className="muted" style={{ fontSize: 13 }}>{isNew ? 'Neuer Kunde' : 'Kunde bearbeiten'}</div>
            <h2>{c.name || 'Ohne Namen'}</h2>
          </div>
          <button className="cmd-x" onClick={close} aria-label="Schließen">×</button>
        </header>

        <div className="cmd-body">
          {/* Status */}
          <section className={`ds ds-status ${c.active !== false ? 'is-on' : 'is-off'}`}>
            <button type="button" className={`switch big ${c.active !== false ? 'on' : ''}`} role="switch" aria-checked={c.active !== false} onClick={() => upd({ active: c.active === false })}><i /></button>
            <div>
              <b>{c.active !== false ? 'Konto aktiv' : 'Konto gesperrt'}</b>
              <div className="muted" style={{ fontSize: 13 }}>{c.active !== false ? 'Der Kunde kann sich anmelden, Preise sehen und anfragen.' : 'Anmeldung ist nicht möglich.'}{c.pending ? ' Neu registriert.' : ''}</div>
            </div>
          </section>

          <section className="ds">
            <h3>Kunde</h3>
            <label>Name / Firma / Verein *</label>
            <input value={c.name} onChange={(e) => upd({ name: e.target.value })} placeholder="z. B. SV Musterstadt" autoFocus={isNew} />
            <label>E-Mail <span className="muted">(für Anmeldung mit Passwort)</span></label>
            <input type="email" value={c.email ?? ''} onChange={(e) => upd({ email: e.target.value.trim() || null, hasPw: false })} placeholder="kunde@firma.de" />
          </section>

          <section className="ds">
            <h3>Anmeldung</h3>
            <div className="ds-grid">
              <div>
                <label>Zugangscode</label>
                <div className="ds-inline">
                  <input value={c.code} onChange={(e) => upd({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })} className="mono" />
                  <button type="button" className="btn alt sm" onClick={() => upd({ code: gen() })} title="Neuen Code erzeugen">↻</button>
                  <button type="button" className="btn alt sm" onClick={() => { navigator.clipboard.writeText(c.code); say(true, 'Code kopiert.'); }} title="Code kopieren">⧉</button>
                </div>
              </div>
              <div>
                <label>Passwort</label>
                <div className="ds-pw">
                  {!c.email ? <span className="tag">Erst E-Mail eintragen</span> : c.hasPw ? <span className="tag tag-ok">🔑 Passwort festgelegt</span> : <span className="tag tag-warn">✉ Noch nicht festgelegt</span>}
                </div>
              </div>
            </div>
            <div className="ds-actions">
              {c.email && <button type="button" className="btn alt sm" disabled={!mail || dirty} title={!mail ? 'SMTP fehlt in der .env' : dirty ? 'Erst speichern' : ''} onClick={invite}>{c.hasPw ? 'Passwort-Link senden' : 'Einladung per E-Mail senden'}</button>}
              <button type="button" className="btn alt sm" onClick={() => { navigator.clipboard.writeText(inviteText()); say(true, 'Einladungstext kopiert – z. B. in WhatsApp oder Mail einfügen.'); }}>Einladungstext kopieren</button>
            </div>
            {c.email && dirty && mail && <p className="ds-hint">Zum Senden der Einladung zuerst speichern.</p>}
          </section>

          <section className="ds">
            <h3>Preise</h3>
            <label>Aufschlag auf den Einkaufspreis</label>
            <div className="seg">
              <button type="button" className={markupMode === 'std' ? 'on' : ''} onClick={() => upd({ markup: null })}>Standard ({defaultMarkup} %)</button>
              <button type="button" className={markupMode === 'own' ? 'on' : ''} onClick={() => upd({ markup: c.markup ?? defaultMarkup })}>Eigener Wert</button>
            </div>
            {markupMode === 'own' && <div className="ds-inline" style={{ maxWidth: 200, marginTop: 8 }}><input inputMode="decimal" value={c.markup ?? ''} onChange={(e) => upd({ markup: e.target.value === '' ? 0 : Number(e.target.value.replace(',', '.')) || 0 })} /><span className="unit">%</span></div>}

            <label style={{ marginTop: 16 }}>Mengenrabatt (Staffel)</label>
            <div className="seg">
              <button type="button" className={tierMode === 'std' ? 'on' : ''} onClick={() => upd({ tiers: null })}>Standard</button>
              <button type="button" className={tierMode === 'own' ? 'on' : ''} onClick={() => upd({ tiers: tierMode === 'own' ? c.tiers : defaultTiers || '10:5' })}>Eigene</button>
              <button type="button" className={tierMode === 'none' ? 'on' : ''} onClick={() => upd({ tiers: '-' })}>Keine</button>
            </div>
            {tierMode === 'std' && <p className="ds-hint">{defaultTiers ? parseTiers(defaultTiers).map((t) => `ab ${t.min} Stk. −${t.pct} %`).join(' · ') : 'Kein Standard-Rabatt eingestellt.'}</p>}
            {tierMode === 'own' && (
              <div className="tier-ed">
                {tierRows.map((r, k) => (
                  <div key={k} className="tier-row">
                    <span>ab</span><input inputMode="numeric" value={r.min} onChange={(e) => editRow(k, { min: Number(e.target.value) || 0 })} /><span>Stück</span>
                    <span>−</span><input inputMode="decimal" value={r.pct} onChange={(e) => editRow(k, { pct: Number(e.target.value.replace(',', '.')) || 0 })} /><span>%</span>
                    <button type="button" className="x" onClick={() => writeRows(tierRows.filter((_, n) => n !== k))} aria-label="Stufe entfernen">×</button>
                  </div>
                ))}
                <button type="button" className="linkbtn" onClick={() => { const last = tierRows[tierRows.length - 1]; writeRows([...tierRows, { min: last ? last.min * 2 : 10, pct: last ? last.pct + 5 : 5 }]); }}>+ Stufe hinzufügen</button>
              </div>
            )}
          </section>

          <section className="ds">
            <h3>Eigene Kollektion <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>(optional)</span></h3>
            <p className="ds-hint" style={{ marginTop: 0 }}>Diese Artikel sieht der Kunde zuerst.</p>
            <PickedStrip items={products} value={skuIds} onOpen={() => setPicker(true)} onRemove={(id) => setSkuIds(skuIds.filter((x) => x !== id))} />
            {picker && <ArticlePicker items={products} groups={groups} value={skuIds} onChange={setSkuIds} title={`Kollektion für ${c.name || 'den Kunden'}`} onClose={() => setPicker(false)} />}
            {!!c.skus?.length && <label className="ds-check"><input type="checkbox" checked={!!c.exclusive} onChange={(e) => upd({ exclusive: e.target.checked })} /> Nur diese Artikel anzeigen (restlicher Katalog ausgeblendet)</label>}
          </section>

          <section className="ds">
            <h3>Logo des Kunden</h3>
            {c.logoId ? (
              <div className="logo-file">
                {/\.(png|jpe?g|webp|svg)$/i.test(c.logoName ?? '') ? <img src={`/api/upload/${c.logoId}`} alt="" /> : <span className="file-ico">{c.logoName?.split('.').pop()?.toUpperCase()}</span>}
                <span>{c.logoName}</span>
                <button type="button" className="linkbtn" onClick={() => upd({ logoId: null, logoName: null })}>entfernen</button>
              </div>
            ) : <label className="btn alt sm upl" style={{ width: 'fit-content' }}>Logo hochladen<input type="file" hidden accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.ai,.eps" onChange={(e) => uploadLogo(e.target.files?.[0])} /></label>}
            <p className="ds-hint">Wird bei der Veredelung automatisch vorgeschlagen.</p>
          </section>

          <section className="ds">
            <h3>Interne Notiz</h3>
            <textarea value={c.note ?? ''} onChange={(e) => upd({ note: e.target.value })} placeholder="nur für Sie sichtbar – Ansprechpartner, Telefon, Absprachen …" rows={4} />
          </section>
        </div>

        <footer className="cmd-foot">
          {!isNew && <button type="button" className="linkbtn err" onClick={remove}>Löschen</button>}
          <span style={{ flex: 1 }} />
          {err && <span className="err" style={{ fontSize: 14 }}>{err}</span>}
          <button type="button" className="btn alt" onClick={close}>Abbrechen</button>
          <button type="button" className="btn" disabled={busy || !dirty} onClick={save}>{busy ? 'Speichert …' : isNew ? 'Kunde anlegen' : dirty ? 'Speichern' : 'Gespeichert'}</button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
