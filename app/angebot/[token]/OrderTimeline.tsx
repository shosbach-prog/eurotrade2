type Step = { label: string; date: string | null; done: boolean; hint?: string; href?: string };

/** Auftragsstatus als Zeitleiste – der nächste offene Schritt ist hervorgehoben */
export default function OrderTimeline({ steps }: { steps: Step[] }) {
  const cur = steps.findIndex((s) => !s.done);
  return (
    <ol className="otl">
      {steps.map((s, k) => (
        <li key={s.label} className={s.done ? 'done' : k === cur ? 'cur' : ''}>
          <span className="otl-dot">{s.done ? '✓' : k + 1}</span>
          <b>{s.label}</b>
          {s.date && <small>{new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</small>}
          {s.hint && (s.href ? <a href={s.href} target="_blank" rel="noreferrer" className="alink">{s.hint}</a> : <small className="muted">{s.hint}</small>)}
        </li>
      ))}
    </ol>
  );
}
