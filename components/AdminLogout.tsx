'use client';
export default function AdminLogout() {
  return <button type="button" className="linkbtn" onClick={async () => { await fetch('/api/admin/login', { method: 'DELETE' }); window.location.href = '/admin/login'; }}>Abmelden</button>;
}
