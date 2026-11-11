import Link from 'next/link';
import AdminLogout from './AdminLogout';
import { fileCustomers, listAccessRequests } from '@/lib/store';
import PendingBox from '@/app/admin/kunden/PendingBox';

export default function AdminNav({ active }: { active: 'anfragen' | 'kunden' | 'referenzen' | 'newsletter' | 'bewertungen' | 'artikel' }) {
  // Wartende Registrierungen + offene Zugangsanfragen – immer sichtbar im Admin
  const waiting = fileCustomers().filter((c) => c.pending && c.active === false);
  const pending = waiting.length;
  const requests = listAccessRequests().filter((r) => !r.done).length;
  const todo = pending + requests;
  return (
    <>
      <div className="admin-nav">
        <Link href="/admin" className={active === 'anfragen' ? 'on' : ''}>Anfragen & Angebote</Link>
        <Link href="/admin/kunden" className={active === 'kunden' ? 'on' : ''}>Kunden{todo > 0 && <span className="nav-badge">{todo}</span>}</Link>
        <Link href="/admin/artikel" className={active === 'artikel' ? 'on' : ''}>Artikel</Link>
        <Link href="/admin/bewertungen" className={active === 'bewertungen' ? 'on' : ''}>Bewertungen</Link>
        <Link href="/admin/referenzen" className={active === 'referenzen' ? 'on' : ''}>Referenzen</Link>
        <Link href="/admin/newsletter" className={active === 'newsletter' ? 'on' : ''}>Newsletter</Link>
        <span style={{ flex: 1 }} />
        <Link href="/">Zum Shop</Link>
        <AdminLogout />
      </div>
      {/* Neue Registrierungen: auf JEDER Admin-Seite ganz oben, mit Freischalt-Buttons */}
      <PendingBox items={waiting.map((c) => ({ code: c.code, name: c.name, email: c.email, note: c.note, createdAt: c.createdAt }))} />
    </>
  );
}
