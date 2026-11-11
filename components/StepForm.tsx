'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/* Formular im „Typeform“-Stil: eine Frage pro Schritt, Unterstrich-Felder, Enter = weiter */

export type Vals = Record<string, string>;
export type Field =
  | { kind: 'text' | 'email' | 'tel' | 'number'; name: string; label: string; placeholder?: string; required?: boolean; autoComplete?: string }
  | { kind: 'textarea'; name: string; label: string; placeholder?: string; required?: boolean }
  | { kind: 'choice'; name: string; label?: string; options: string[]; required?: boolean }
  | { kind: 'file'; name: string; label: string; accept?: string }
  | { kind: 'check'; name: string; label: ReactNode; required?: boolean };
export type Step = { title: string; hint?: string; fields: Field[] };

const PREFIXES = [{ cc: 'DE', flag: '🇩🇪', p: '+49' }, { cc: 'AT', flag: '🇦🇹', p: '+43' }, { cc: 'CH', flag: '🇨🇭', p: '+41' }, { cc: 'NL', flag: '🇳🇱', p: '+31' }, { cc: 'BE', flag: '🇧🇪', p: '+32' }, { cc: 'LU', flag: '🇱🇺', p: '+352' }, { cc: '–', flag: '🌍', p: '' }];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function StepForm({ steps, submitLabel, onSubmit, done, aside, initial = {} }: {
  steps: Step[]; submitLabel: string; onSubmit: (v: Vals, files: Record<string, File | null>) => Promise<string | null>;
  done: ReactNode; aside?: ReactNode; initial?: Vals;
}) {
  const [i, setI] = useState(0);
  const [v, setV] = useState<Vals>(initial);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [dir, setDir] = useState<1 | -1>(1);
  const box = useRef<HTMLDivElement>(null);
  const last = i === steps.length - 1;
  const set = (k: string, x: string) => { setV((o) => ({ ...o, [k]: x })); setMissing((m) => m.filter((y) => y !== k)); };

  // Fokus aufs erste Feld des Schritts (ohne die Seite springen zu lassen)
  useEffect(() => {
    if (i === 0) return;
    const el = box.current?.querySelector<HTMLElement>('input:not([type=checkbox]):not([type=file]),textarea');
    (el ?? box.current)?.focus({ preventScroll: true }); // ohne Textfeld: Container, damit Buchstaben-Kürzel greifen
  }, [i]);

  function check() {
    const miss = steps[i].fields.filter((f) => 'required' in f && f.required && !(f.kind === 'check' ? v[f.name] === 'on' : (v[f.name] ?? '').trim())).map((f) => f.name);
    const badMail = steps[i].fields.find((f) => f.kind === 'email' && v[f.name] && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v[f.name]));
    if (badMail) miss.push(badMail.name);
    setMissing(miss);
    return miss.length === 0;
  }
  async function next() {
    if (!check()) return;
    if (!last) { setDir(1); setI(i + 1); return; }
    setState('busy'); setErr('');
    const e = await onSubmit(v, files);
    if (e) { setErr(e); setState('idle'); } else setState('done');
  }
  const back = () => { if (i > 0) { setDir(-1); setI(i - 1); setMissing([]); } };
  const onKey = (e: React.KeyboardEvent) => {
    // Typeform-Kürzel: Buchstabe wählt Antwort (wenn kein Textfeld aktiv ist)
    const ch = steps[i].fields.find((f) => f.kind === 'choice') as Extract<Field, { kind: 'choice' }> | undefined;
    const typing = e.target instanceof HTMLInputElement && e.target.type !== 'checkbox' || e.target instanceof HTMLTextAreaElement;
    if (ch && !typing && /^[a-z]$/i.test(e.key) && !e.metaKey && !e.ctrlKey) {
      const o = ch.options[LETTERS.indexOf(e.key.toUpperCase())];
      if (o) { e.preventDefault(); set(ch.name, o); return; }
    }
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); next(); }
  };

  const step = steps[i];
  const req = (f: Field) => ('required' in f && f.required ? <span className="tf-req">*</span> : null);
  const miss = (n: string) => missing.includes(n);

  return (
    <div className="tf">
      <div className="tf-main" ref={box} onKeyDown={onKey} tabIndex={-1}>
        {state === 'done' ? <div className="tf-done">{done}</div> : (
          <div key={i} className={`tf-step ${dir > 0 ? 'in-up' : 'in-down'}`}>
            <div className="tf-q"><span className="tf-num">{i + 1}</span><h3>{step.title}{step.fields.some((f) => 'required' in f && f.required) && <span className="tf-req">*</span>}</h3></div>
            {step.hint && <p className="tf-hint">{step.hint}</p>}
            {step.fields.map((f) => {
              if (f.kind === 'choice') return (
                <div key={f.name} className="tf-field">
                  {f.label && <label className="tf-label">{f.label}{req(f)}</label>}
                  <div className="tf-choices">
                    {f.options.map((o, n) => (
                      <button key={o} type="button" className={`tf-choice ${v[f.name] === o ? 'on' : ''}`} onClick={() => set(f.name, o)}>
                        <span className="tf-key">{LETTERS[n]}</span>{o}{v[f.name] === o && <span className="tf-tick">✓</span>}
                      </button>
                    ))}
                  </div>
                  {miss(f.name) && <div className="tf-miss">Bitte eine Antwort wählen</div>}
                </div>
              );
              if (f.kind === 'check') return (
                <label key={f.name} className={`tf-check ${miss(f.name) ? 'bad' : ''}`}>
                  <input type="checkbox" checked={v[f.name] === 'on'} onChange={(e) => set(f.name, e.target.checked ? 'on' : '')} />
                  <span>{f.label}{req(f)}</span>
                </label>
              );
              if (f.kind === 'file') return (
                <div key={f.name} className="tf-field">
                  <label className="tf-label">{f.label}</label>
                  <label className="tf-file">
                    <input type="file" hidden accept={f.accept} onChange={(e) => setFiles((o) => ({ ...o, [f.name]: e.target.files?.[0] ?? null }))} />
                    <span>{files[f.name] ? `📎 ${files[f.name]!.name}` : 'Datei auswählen oder hierher ziehen'}</span>
                  </label>
                </div>
              );
              if (f.kind === 'tel') {
                const pre = v[f.name + '_pre'] ?? '+49';
                return (
                  <div key={f.name} className="tf-field">
                    <label className="tf-label" htmlFor={`tf-${f.name}`}>{f.label}{req(f)}</label>
                    <div className="tf-tel">
                      <select value={pre} onChange={(e) => set(f.name + '_pre', e.target.value)} aria-label="Ländervorwahl">
                        {PREFIXES.map((x) => <option key={x.cc} value={x.p}>{x.flag} {x.p}</option>)}
                      </select>
                      <input id={`tf-${f.name}`} type="tel" className={miss(f.name) ? 'bad' : ''} value={v[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} autoComplete="tel-national" />
                    </div>
                    {miss(f.name) && <div className="tf-miss">Bitte ausfüllen</div>}
                  </div>
                );
              }
              return (
                <div key={f.name} className="tf-field">
                  <label className="tf-label" htmlFor={`tf-${f.name}`}>{f.label}{req(f)}</label>
                  {f.kind === 'textarea'
                    ? <textarea id={`tf-${f.name}`} className={miss(f.name) ? 'bad' : ''} value={v[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} rows={3} />
                    : <input id={`tf-${f.name}`} type={f.kind} inputMode={f.kind === 'number' ? 'numeric' : undefined} className={miss(f.name) ? 'bad' : ''} value={v[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} autoComplete={'autoComplete' in f ? f.autoComplete : undefined} />}
                  {miss(f.name) && <div className="tf-miss">{f.kind === 'email' && v[f.name] ? 'Bitte eine gültige E-Mail-Adresse eingeben' : 'Bitte ausfüllen'}</div>}
                </div>
              );
            })}
            <div className="tf-actions">
              <button type="button" className="tf-ok" onClick={next} disabled={state === 'busy'}>{state === 'busy' ? 'Wird gesendet …' : last ? submitLabel : 'Ok'}</button>
              {!last && <span className="tf-enter">oder <b>Enter ↵</b> drücken</span>}
            </div>
            {err && <div className="tf-miss" style={{ marginTop: 12 }}>{err}</div>}
          </div>
        )}
        {state !== 'done' && (
          <div className="tf-nav">
            <div className="tf-progress" aria-hidden><span style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>
            <button type="button" onClick={back} disabled={i === 0} aria-label="Zurück">⌃</button>
            <button type="button" onClick={next} disabled={state === 'busy'} aria-label="Weiter">⌄</button>
          </div>
        )}
      </div>
      {aside && <aside className="tf-aside">{aside}</aside>}
    </div>
  );
}
