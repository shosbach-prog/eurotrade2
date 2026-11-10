'use client';
export default function LogoutLink() {
  return <button type="button" className="linkbtn" onClick={async () => { await fetch('/api/zugang', { method: 'DELETE' }); window.location.href = '/zugang'; }}>Abmelden</button>;
}
