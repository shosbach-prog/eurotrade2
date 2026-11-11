import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import PricingEditor from './PricingEditor';
import { getPricing } from '@/lib/deco-pricing-store';
import { DEFAULT_PRICING } from '@/lib/deco-pricing';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Veredelung kalkulieren', robots: { index: false, follow: false } };

export default function Veredelung() {
  const p = getPricing();
  return (
    <>
      <AdminNav active="veredelung" />
      <h1>Veredelung kalkulieren</h1>
      <p className="muted" style={{ marginTop: -6 }}>Preise netto je Stück und Position – nach Motivbreite und Gesamtmenge. Daraus entstehen automatisch die Veredelungs-Positionen im Angebot und (optional) der „ca.“-Preis im Shop.</p>
      {p.isDefault && <p className="sys-warn">⚠ Es sind noch <b>Beispielwerte</b> hinterlegt. Bitte an Ihre Einkaufspreise und Ihren Aufschlag anpassen und speichern.</p>}
      <PricingEditor initial={p} defaults={DEFAULT_PRICING} />
    </>
  );
}
