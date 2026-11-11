'use client';
import { useState } from 'react';
export default function AcceptForm({ token, defaultName, total, hasPreview }: { token: string; defaultName: string; total: string; hasPreview?: boolean }) {
  const [prevOk, setPrevOk] = useState(false);
  const [name, setName] = useState(defaultName); const [comment, setComment] = useState('');
  const [agree, setAgree] = useState(false); const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle'); const [err, setErr] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setState('busy'); setErr('');
    const r = await fetch(`/api/angebot/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, comment, previewOk: hasPreview ? prevOk : undefined }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setState('done'); else { setErr(d.error ?? 'Fehler'); setState('idle'); }
  }
  if (state === 'done') return <p className="ok" style={{ margin: 0, fontWeight: 600 }}>✓ Vielen Dank! Ihre Annahme ist bei uns eingegangen – Sie erhalten gleich eine Bestätigung per E-Mail.</p>;
  return (
    <form className="form" onSubmit={submit}>
      <strong style={{ fontSize: 17 }}>Angebot annehmen</strong>
      <div className="two">
        <div><label>Ihr Name *</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div><label>Anmerkung</label><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="z. B. Wunschliefertermin" /></div>
      </div>
      <label style={{ display: 'flex', gap: 8, fontWeight: 400, marginTop: 14 }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 'auto' }} />
        <span>Ich nehme das Angebot über {total} verbindlich an. Es gelten die <a href="/agb" target="_blank" style={{ textDecoration: 'underline' }}>AGB</a>. Die <a href="/widerruf" target="_blank" style={{ textDecoration: 'underline' }}>Widerrufsbelehrung</a> habe ich zur Kenntnis genommen. Mir ist bekannt, dass für nach meinen Vorgaben veredelte Ware kein Widerrufsrecht besteht.</span>
      </label>
      {hasPreview && <label style={{ display: 'flex', gap: 8, fontWeight: 400, marginTop: 10 }}>
        <input type="checkbox" checked={prevOk} onChange={(e) => setPrevOk(e.target.checked)} style={{ width: 'auto' }} />
        <span>Ich habe die Motiv-Vorschau oben geprüft und gebe Position und Größe frei.</span>
      </label>}
      <button className="btn" disabled={!agree || (hasPreview && !prevOk) || !name.trim() || state === 'busy'}>{state === 'busy' ? 'Wird gesendet …' : 'Verbindlich annehmen'}</button>
      {err && <p className="err">{err}</p>}
    </form>
  );
}
