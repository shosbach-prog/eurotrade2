import type { Metadata } from 'next';
import AdminLoginForm from './AdminLoginForm';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export default function AdminLogin({ searchParams }: { searchParams: { weiter?: string } }) {
  const next = searchParams.weiter?.startsWith('/admin') ? searchParams.weiter : '/admin';
  return (
    <div className="gate"><div className="gate-box">
      <h1>Admin-Bereich</h1>
      <p className="muted">Anfragen, Angebote und Kundencodes verwalten.</p>
      <AdminLoginForm next={next} />
    </div></div>
  );
}
