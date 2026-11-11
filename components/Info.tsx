'use client';
import { useState } from 'react';
/** kleines (i) mit Erklärung – Hover am Desktop, Tippen am Handy */
export default function Info({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`info-i ${open ? 'open' : ''}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label="Info" onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}>i</button>
      {open && <span className="info-pop" role="tooltip">{children}</span>}
    </span>
  );
}
