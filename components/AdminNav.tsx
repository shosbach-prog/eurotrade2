import Link from 'next/link';
import AdminLogout from './AdminLogout';
import { fileCustomers, listAccessRequests } from '@/lib/store';
import PendingBox from '@/app/admin/kunden/PendingBox';
import { licenseInfo } from '@/lib/license';
import { isOverdue, listInvoices } from '@/lib/invoice';

export default function AdminNav({ active }: { active: 'anfragen' | 'kunden' | 'referenzen' | 'newsletter' | 'bewertungen' | 'artikel' | 'system' | 'veredelung' | 'teamshops' | 'rechnungen' }) {
  // Wartende Registrierungen + offene Zugangsanfragen – immer sichtbar im Admin
  const waiting = fileCustomers().filter((c) => c.pending && c.active === false);
  const pending = waiting.length;
  const requests = listAccessRequests().filter((r) => !r.done).length;
  const todo = pending + requests;
  return (
    <>
      <div className="admin-nav">
        <Link href="/admin" className={active === 'anfragen' ? 'on' : ''}>Anfragen</Link>
        {(() => { const od = listInvoices().filter(isOverdue).length; return <Link href="/admin/rechnungen" className={active === 'rechnungen' ? 'on' : ''}>Rechnungen{od > 0 && <span className="nav-badge" title="überfällig">{od}</span>}</Link>; })()}
        <Link href="/admin/kunden" className={active === 'kunden' ? 'on' : ''}>Kunden{todo > 0 && <span className="nav-badge">{todo}</span>}</Link>
        <Link href="/admin/artikel" className={active === 'artikel' ? 'on' : ''}>Artikel</Link>
        <Link href="/admin/teamshops" className={active === 'teamshops' ? 'on' : ''}>Team-Shops</Link>
        <Link href="/admin/veredelung" className={active === 'veredelung' ? 'on' : ''}>Veredelung</Link>
        <Link href="/admin/bewertungen" className={active === 'bewertungen' ? 'on' : ''}>Bewertungen</Link>
        <Link href="/admin/referenzen" className={active === 'referenzen' ? 'on' : ''}>Referenzen</Link>
        <Link href="/admin/newsletter" className={active === 'newsletter' ? 'on' : ''}>Newsletter</Link>
        <Link href="/admin/system" className={active === 'system' ? 'on' : ''}>System{!process.env.SMTP_HOST && <span className="nav-badge">!</span>}</Link>
        <span style={{ flex: 1 }} />
        <Link href="/">Zum Shop</Link>
        <AdminLogout />
      </div>
      {(() => { const l = licenseInfo(); return l.warn ? <div className={`lic-bar ${l.expired ? 'bad' : ''}`}>⚠ {l.expired ? 'Die Bildlizenz von L-SHOP ist abgelaufen' : `Bildlizenz L-SHOP läuft in ${l.days} Tagen ab (${l.until.toLocaleDateString('de-DE')})`} – neue Bildpakete laden und austauschen. <Link href="/admin/system#lizenz">Was ist zu tun?</Link></div> : null; })()}
      {/* Neue Registrierungen: auf JEDER Admin-Seite ganz oben, mit Freischalt-Buttons */}
      <PendingBox items={waiting.map((c) => ({ code: c.code, name: c.name, email: c.email, note: c.note, createdAt: c.createdAt }))} />
    </>
  );
}
