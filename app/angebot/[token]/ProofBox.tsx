'use client';
import { useState } from 'react';
import type { Inquiry } from '@/lib/store';

/** Druck-/Stickfreigabe: Korrekturabzug ansehen, freigeben oder Änderung wünschen */
export default function ProofBox({ token, proof, name }: { token: string; proof: NonNullable<Inquiry['proof']>; name: string }) {
  const [who, setWho] = useState(name);
  const [mode, setMode] = useState<'idle' | 'change'>('idle');
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'changed'>(proof.approvedAt ? 'ok' : 'idle');
  const [err, setErr] = useState('');
  async function send(action: 'ok' | 'change') {
    setState('busy'); setErr('');
    const r = await fetch(`/api/angebot/${token}/freigabe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, name: who, text }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setState(action === 'ok' ? 'ok' : 'changed'); else { setErr(d.error ?? 'Fehler'); setState('idle'); }
  }
  return (
    <div className="box proof" id="freigabe" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Druck- / Stickfreigabe</h2>
      <p className="muted" style={{ marginTop: -4 }}>Bitte prüfen Sie Schreibweise, Farben, Position und Größe. Erst nach Ihrer Freigabe starten wir die Produktion.</p>
      <div className="of-prev">{proof.ids.map((x) => /\.pdf$/i.test(x.name)
        ? <a key={x.id} href={`/api/angebot/${token}/bild/${x.id}`} target="_blank" rel="noreferrer" className="pdf"><span className="file-ico">PDF</span><span>{x.name}</span></a>
        : <a key={x.id} href={`/api/angebot/${token}/bild/${x.id}`} target="_blank" rel="noreferrer"><img src={`/api/angebot/${token}/bild/${x.id}`} alt={x.name} /><span>{x.name}</span></a>)}</div>
      {proof.note && <p style={{ whiteSpace: 'pre-wrap' }}>{proof.note}</p>}
      {state === 'ok' ? <p className="ok" style={{ fontWeight: 600 }}>✓ Freigegeben{proof.approvedBy ? ` von ${proof.approvedBy}` : ''} – vielen Dank, wir starten die Produktion.</p>
        : state === 'changed' ? <p className="ok" style={{ fontWeight: 600 }}>✓ Ihr Änderungswunsch ist bei uns – Sie erhalten eine neue Vorschau.</p>
        : <div className="form">
          <div className="two"><div><label>Ihr Name *</label><input value={who} onChange={(e) => setWho(e.target.value)} /></div></div>
          {mode === 'change' && <><label>Was sollen wir ändern? *</label><textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Logo 1 cm kleiner, Schriftzug in Weiß statt Gelb" /></>}
          <div className="deco-row" style={{ marginTop: 10 }}>
            {mode === 'idle' ? <>
              <button className="btn" disabled={!who.trim() || state === 'busy'} onClick={() => send('ok')}>✓ Vorschau freigeben</button>
              <button className="btn alt" onClick={() => setMode('change')}>Änderung wünschen</button>
            </> : <>
              <button className="btn" disabled={!who.trim() || !text.trim() || state === 'busy'} onClick={() => send('change')}>Änderung senden</button>
              <button className="linkbtn" onClick={() => setMode('idle')}>zurück</button>
            </>}
          </div>
          {err && <p className="err">{err}</p>}
        </div>}
    </div>
  );
}
