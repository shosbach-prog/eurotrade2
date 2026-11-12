'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { eur } from '@/lib/format';

/** Anzeige netto oder brutto (inkl. MwSt.) – Auswahl im Cookie, damit die Seite gleich richtig geladen wird */
type Mode = 'netto' | 'brutto';
const Ctx = createContext<{ mode: Mode; vat: number; set: (m: Mode) => void }>({ mode: 'netto', vat: 19, set: () => {} });

export function PriceModeProvider({ initial, vat, children }: { initial: Mode; vat: number; children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const set = (m: Mode) => { setMode(m); try { document.cookie = `et_price=${m}; path=/; max-age=31536000; samesite=lax`; } catch {} };
  return <Ctx.Provider value={{ mode, vat, set }}>{children}</Ctx.Provider>;
}

/** p(netto) → formatierter Preis in der gewählten Anzeige; label = „netto“ bzw. „inkl. MwSt.“ */
export function usePrice() {
  const { mode, vat, set } = useContext(Ctx);
  const conv = (net: number) => (mode === 'brutto' ? Math.round(net * (1 + vat / 100) * 100) / 100 : net);
  return { mode, set, conv, p: (net: number | null | undefined) => (net == null ? '–' : eur(conv(net))),
    /** Einzelpreis × Menge – brutto wie auf der Rechnung je Stück gerundet */
    pq: (unitNet: number, qty: number) => eur(Math.round(conv(unitNet) * qty * 100) / 100), cq: (unitNet: number, qty: number) => conv(unitNet) * qty, label: mode === 'brutto' ? 'inkl. MwSt.' : 'netto', other: (net: number) => (mode === 'brutto' ? `${eur(net)} netto` : `${eur(Math.round(net * (1 + vat / 100) * 100) / 100)} brutto`) };
}

/** Preis-Baustein für Server-Komponenten */
export function Money({ net, label = false }: { net: number; label?: boolean }) {
  const { p, label: l } = usePrice();
  return <>{p(net)}{label && <> <small>{l}</small></>}</>;
}

/** Umschalter netto / brutto */
export function PriceToggle({ className = '' }: { className?: string }) {
  const { mode, set } = usePrice();
  return (
    <div className={`ptoggle ${className}`} role="group" aria-label="Preisanzeige">
      <button type="button" className={mode === 'netto' ? 'on' : ''} aria-pressed={mode === 'netto'} onClick={() => set('netto')}>netto</button>
      <button type="button" className={mode === 'brutto' ? 'on' : ''} aria-pressed={mode === 'brutto'} onClick={() => set('brutto')}>brutto</button>
    </div>
  );
}
