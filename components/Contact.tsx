'use client';
import { useState } from 'react';
/** schwebender Kontakt-Button: WhatsApp, Anruf, E-Mail */
export default function Contact({ whatsapp, phone, email }: { whatsapp: string; phone: string; email: string }) {
  const [open, setOpen] = useState(false);
  const wa = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hallo Euro-Trade, ich habe eine Frage zu: ' + (typeof window !== 'undefined' ? window.location.href : ''))}`;
  return (
    <div className={`contact ${open ? 'open' : ''}`}>
      {open && (
        <div className="contact-menu" role="menu">
          <strong>Fragen? Wir helfen gern.</strong>
          {whatsapp && <a href={wa} target="_blank" rel="noreferrer" className="c-wa"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.9-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" /></svg>WhatsApp</a>}
          {phone && <a href={`tel:${phone.replace(/[^\d+]/g, '').replace(/^0/, '+49')}`} aria-label={`Produktberatung ${phone}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>{phone}</a>}
          {email && <a href={`mailto:${email}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg>{email}</a>}
        </div>
      )}
      <button className="contact-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Kontakt">
        {open ? '×' : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1.1-4.2a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.4-8.5h.5A8.5 8.5 0 0 1 21 11v.5z" /></svg>}
      </button>
    </div>
  );
}
