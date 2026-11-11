'use client';
import { useEffect, useState, type ReactNode } from 'react';

/** Ein Formularbereich mit Umschalter – statt zwei gleich aussehender Formulare untereinander */
export default function StartForms({ quote, access }: { quote: ReactNode; access: ReactNode }) {
  const [tab, setTab] = useState<'preis' | 'zugang'>('preis');
  useEffect(() => {
    const sync = () => { if (location.hash === '#anfragen') setTab('zugang'); else if (location.hash === '#preis') setTab('preis'); };
    sync(); window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  return (
    <section id="preis" className="l-section">
      <span id="anfragen" style={{ position: 'relative', top: -90 }} />
      <div className="sf-switch seg">
        <button type="button" className={tab === 'preis' ? 'on' : ''} onClick={() => setTab('preis')}>Preis anfragen</button>
        <button type="button" className={tab === 'zugang' ? 'on' : ''} onClick={() => setTab('zugang')}>Zugang zum Shop anfragen</button>
      </div>
      {tab === 'preis' ? quote : access}
    </section>
  );
}
