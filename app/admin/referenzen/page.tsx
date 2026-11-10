import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import RefEditor from './RefEditor';
import { listReferences } from '@/lib/store';

export const metadata: Metadata = { title: 'Referenzen', robots: { index: false, follow: false } };
export default function Referenzen() {
  return (
    <>
      <AdminNav active="referenzen" />
      <h1>Referenzen</h1>
      <p className="muted" style={{ marginTop: -8 }}>Erscheinen öffentlich auf der Startseite. Bitte nur mit Einverständnis der Kunden veröffentlichen – auch für Fotos mit erkennbaren Personen.</p>
      <RefEditor initial={listReferences()} />
    </>
  );
}
