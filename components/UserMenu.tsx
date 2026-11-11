'use client';
import { useEffect, useRef, useState } from 'react';

/** Kopfzeile rechts: angemeldeter Kunde (Menü mit Abmelden), Admin oder „Anmelden“ */
export default function UserMenu({ name, admin }: { name?: string | null; admin?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  async function logout() {
    if (name) await fetch('/api/zugang', { method: 'DELETE' });
    else if (admin) await fetch('/api/admin/login', { method: 'DELETE' });
    window.location.href = '/zugang?abgemeldet=1';
  }

  if (!name && !admin) return <a href="/zugang" className="cart-btn um-login">Anmelden</a>;
  const label = name ?? 'Admin';
  const initials = label.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'A';

  return (
    <div className="um" ref={box}>
      <button type="button" className="cart-btn um-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="um-av" aria-hidden>{initials}</span>
        <span className="hide-sm um-name">{label}</span>
        <span aria-hidden className="um-caret">▾</span>
      </button>
      {open && (
        <div className="um-menu" role="menu">
          <div className="um-head"><span className="muted" style={{ fontSize: 12 }}>Angemeldet als</span><b>{label}</b></div>
          {name && <a role="menuitem" href="/konto">📋 Anfragen &amp; Nachbestellen</a>}
          {name && <a role="menuitem" href="/merkliste">♡ Merkliste</a>}
          {name && <a role="menuitem" href="/konto#anmeldung">🔑 E-Mail & Passwort</a>}
          {admin && <a role="menuitem" href="/admin">⚙ Admin-Bereich</a>}
          <button role="menuitem" type="button" className="um-out" onClick={logout}>⎋ Abmelden</button>
        </div>
      )}
    </div>
  );
}
