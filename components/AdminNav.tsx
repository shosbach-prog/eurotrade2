import Link from 'next/link';
import AdminLogout from './AdminLogout';
export default function AdminNav({ active }: { active: 'anfragen' | 'kunden' }) {
  return (
    <div className="admin-nav">
      <Link href="/admin" className={active === 'anfragen' ? 'on' : ''}>Anfragen & Angebote</Link>
      <Link href="/admin/kunden" className={active === 'kunden' ? 'on' : ''}>Kunden & Codes</Link>
      <span style={{ flex: 1 }} />
      <Link href="/">Zum Shop</Link>
      <AdminLogout />
    </div>
  );
}
