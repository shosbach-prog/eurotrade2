import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import Moderation from './Moderation';
import { listReviews } from '@/lib/store';

export const metadata: Metadata = { title: 'Bewertungen', robots: { index: false, follow: false } };
export default function Bewertungen() {
  const all = listReviews().slice().sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <AdminNav active="bewertungen" />
      <h1>Bewertungen</h1>
      <p className="muted" style={{ marginTop: -8 }}>Nur Kunden mit abgeschlossenem Auftrag können bewerten. Bitte negative Bewertungen nicht zurückhalten, nur weil sie negativ sind (UWG). Ablehnen nur bei Beleidigungen, persönlichen Daten oder fehlendem Bezug. Antworten sind öffentlich sichtbar.</p>
      <Moderation initial={all} />
    </>
  );
}
