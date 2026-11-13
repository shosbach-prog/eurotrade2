'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { eur } from '@/lib/format';
import type { Kond } from '@/lib/konditionen';

/** Admin-Sticker mit Einkaufskonditionen (EK, Marge, Aufschlag) auf jeder Produktkarte und Artikelseite.
 *  Nur für angemeldete Admins – Daten kommen gebündelt aus /api/admin/konditionen, nie im HTML für Kunden. */
type Api = { admin: boolean; show: boolean; toggle: () => void; get: (id: string) => Kond | null | undefined; want: (id: string) => void; ver: number };
const Ctx = createContext<Api>({ admin: false, show: false, toggle: () => {}, get: () => undefined, want: () => {}, ver: 0 });
const KEY = 'et_admin_kond';

export function AdminKondProvider({ admin, children }: { admin: boolean; children: ReactNode }) {
  const [show, setShow] = useState(true);
  const [ver, setVer] = useState(0);
  const cache = useRef(new Map<string, Kond | null>());
  const queue = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { try { if (localStorage.getItem(KEY) === 'aus') setShow(false); } catch {} }, []);
  const flush = async () => {
    timer.current = null;
    const keys = [...queue.current]; queue.current.clear();
    if (!keys.length) return;
    // Schlüssel „id“ oder „id@team“ (Team-/Motiv-Shop mit Festpreis) – je Team ein Abruf
    const groups = new Map<string, string[]>();
    for (const k of keys) { const [id, team = ''] = k.split('@'); groups.set(team, [...(groups.get(team) ?? []), id]); }
    for (const [team, ids] of groups) {
      try {
        const r = await fetch('/api/admin/konditionen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, team: team || undefined }) });
        const d: Record<string, Kond | null> = r.ok ? await r.json() : {};
        for (const id of ids) cache.current.set(team ? `${id}@${team}` : id, d[id] ?? null);
      } catch { for (const id of ids) cache.current.set(team ? `${id}@${team}` : id, null); }
    }
    setVer((v) => v + 1);
  };
  const want = useCallback((id: string) => {
    if (!admin || cache.current.has(id) || queue.current.has(id)) return;
    queue.current.add(id);
    if (!timer.current) timer.current = setTimeout(flush, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);
  const toggle = () => setShow((s) => { try { localStorage.setItem(KEY, s ? 'aus' : 'an'); } catch {} return !s; });
  return <Ctx.Provider value={{ admin, show, toggle, get: (id) => cache.current.get(id), want, ver }}>{children}</Ctx.Provider>;
}

const pct = (n: number) => `${n.toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`;
const tone = (p: number | null) => (p == null ? 'k-na' : p < 20 ? 'k-low' : p < 35 ? 'k-mid' : 'k-ok');

/** Kleiner Sticker auf der Produktkarte */
export function KondSticker({ id }: { id: string }) {
  const { admin, show, get, want } = useContext(Ctx);
  useEffect(() => { want(id); }, [id, want]);
  if (!admin || !show) return null;
  const k = get(id);
  if (k === undefined) return <span className="kond-st k-na">EK …</span>;
  if (!k || k.ek == null) return <span className="kond-st k-na">kein EK</span>;
  return (
    <span className={`kond-st ${tone(k.pct)}`} title={`EK ${eur(k.ek)} · VK ${eur(k.vk ?? 0)} · Marge ${eur(k.margin ?? 0)} (${pct(k.pct ?? 0)} vom VK) · Aufschlag ${pct(k.markup ?? 0)}`}>
      <b>EK {eur(k.ek)}</b>
      <span>+{eur(k.margin ?? 0)} · {pct(k.pct ?? 0)}</span>
    </span>
  );
}

/** Ausführlicher Konditionen-Block auf der Artikelseite */
export function KondBox({ id: pid, team }: { id: string; team?: string | null }) {
  const { admin, show, toggle, get, want } = useContext(Ctx);
  const id = team ? `${pid}@${team}` : pid;
  useEffect(() => { want(id); }, [id, want]);
  if (!admin) return null;
  if (!show) return <button type="button" className="kond-toggle" onClick={toggle}>EK-Konditionen einblenden</button>;
  const k = get(id);
  return (
    <div className="kond-box">
      <div className="kond-h">
        <strong>Admin · Konditionen</strong>
        <span className="muted">Standardpreis ohne Kunden-Aufschlag · netto</span>
        <button type="button" onClick={toggle}>ausblenden</button>
      </div>
      {k === undefined ? <p className="muted">lädt …</p> : !k || k.ek == null ? <p className="muted">Kein Einkaufspreis hinterlegt{k?.vk != null ? ` · VK ${eur(k.vk)}` : ''}.</p> : (
        <>
          <div className="kond-kpi">
            <div><small>EK</small><b>{eur(k.ek)}</b></div>
            <div><small>VK{k.sale ? ` (−${k.sale} %)` : ''}</small><b>{eur(k.vk ?? 0)}</b>{k.was != null && <s>{eur(k.was)}</s>}</div>
            <div className={tone(k.pct)}><small>Marge</small><b>{eur(k.margin ?? 0)}</b><span>{pct(k.pct ?? 0)} vom VK</span></div>
            <div><small>Aufschlag</small><b>{pct(k.markup ?? 0)}</b></div>
          </div>
          {k.rows.length > 1 && (
            <table className="kond-t">
              <thead><tr><th>ab Stk.</th><th>EK</th><th>VK</th><th>Marge</th><th>%</th></tr></thead>
              <tbody>{k.rows.map((r) => <tr key={r.min}><td>{r.min}</td><td>{eur(r.ek)}</td><td>{eur(r.vk)}</td><td>{eur(r.margin)}</td><td className={tone(r.pct)}>{pct(r.pct)}</td></tr>)}</tbody>
            </table>
          )}
          {k.fixed && <div className="kond-fix">
            <b>Festpreis {k.fixed.shop}</b>
            <table className="kond-t"><thead><tr><th></th><th>VK fest</th><th>EK</th><th>Druck ca.</th><th>Marge</th><th>%</th></tr></thead>
              <tbody>
                <tr><td>Shirt + Motiv</td><td>{eur(k.fixed.price)}</td><td>{eur(k.fixed.ek)}</td><td>{eur(k.fixed.druck)}</td><td>{eur(k.fixed.margin)}</td><td className={tone(k.fixed.pct)}>{pct(k.fixed.pct)}</td></tr>
                {k.fixed.back && <tr><td>+ Rückendruck</td><td>{eur(k.fixed.back.price)}</td><td>–</td><td>{eur(k.fixed.back.druck)}</td><td>{eur(k.fixed.back.margin)}</td><td className={tone(k.fixed.back.pct)}>{pct(k.fixed.back.pct)}</td></tr>}
              </tbody></table>
            <small className="muted">Druckkosten geschätzt: Veredelungspreis ab 1 Stück × {k.fixed.costPct} % eigene Kosten (Admin → Veredelung){k.fixed.cm ? ` · ${k.fixed.cm}` : ''}</small>
          </div>}
          {k.sizeExtra && <p className="muted kond-ups">EK-Größenaufpreis: {Object.entries(k.sizeExtra).map(([s, e]) => `${s} +${eur(e)}`).join(' · ')}</p>}
        </>
      )}
    </div>
  );
}
