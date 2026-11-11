'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import StepForm, { type Step } from '@/components/StepForm';

/** Preisanfrage ohne Zugangscode – Schritt für Schritt */
export default function QuoteForm({ categories, aside }: { categories: string[]; aside?: ReactNode }) {
  const steps: Step[] = [
    { title: 'Tragen Sie hier Ihre Kontaktinformationen ein:', fields: [
      { kind: 'text', name: 'first', label: 'Vorname', placeholder: 'Max', required: true, autoComplete: 'given-name' },
      { kind: 'text', name: 'last', label: 'Nachname', placeholder: 'Mustermann', required: true, autoComplete: 'family-name' },
      { kind: 'tel', name: 'phone', label: 'Telefonnummer', placeholder: '01512 3456789' },
      { kind: 'email', name: 'email', label: 'E-Mail', placeholder: 'name@beispiel.de', required: true, autoComplete: 'email' },
      { kind: 'text', name: 'company', label: 'Unternehmen / Verein', placeholder: 'Meyer & Söhne', autoComplete: 'organization' },
    ] },
    { title: 'Was brauchen Sie?', fields: [{ kind: 'choice', name: 'category', options: ['Weiß ich noch nicht – bitte beraten', ...categories], required: true }] },
    { title: 'Wie viele Stück ungefähr?', hint: 'Schon ab 1 Stück – ab 10 Stück gibt es Mengenrabatt.', fields: [{ kind: 'number', name: 'qty', label: 'Menge', placeholder: 'z. B. 25' }] },
    { title: 'Soll etwas draufkommen?', fields: [
      { kind: 'choice', name: 'deco', options: ['Druck', 'Stick', 'Beratung gewünscht', 'Ohne Veredelung'], required: true },
      { kind: 'file', name: 'logo', label: 'Logo hochladen (optional) – PNG, JPG, PDF, AI, EPS', accept: '.png,.jpg,.jpeg,.svg,.pdf,.ai,.eps' },
    ] },
    { title: 'Noch etwas, das wir wissen sollten?', fields: [
      { kind: 'textarea', name: 'message', label: 'Nachricht (optional)', placeholder: 'Farben, Größen, Termin, Namen und Nummern …' },
      { kind: 'check', name: 'sample', label: <><b>Muster gewünscht</b> – wir schicken vorab ein Musterteil zur Ansicht.</> },
      { kind: 'check', name: 'privacy', required: true, label: <>Ich stimme der Verarbeitung meiner Daten gemäß <Link href="/datenschutz" style={{ textDecoration: 'underline' }}>Datenschutzerklärung</Link> zu.</> },
    ] },
  ];
  return (
    <StepForm steps={steps} aside={aside} submitLabel="Angebot anfordern"
      done={<><span className="qf-ok">✓</span><h3>Vielen Dank!</h3><p>Ihre Anfrage ist da. Wir melden uns innerhalb von 24 Stunden mit Ihrem Angebot – eine Bestätigung ist per E-Mail unterwegs.</p></>}
      onSubmit={async (v, files) => {
        const fd = new FormData();
        fd.append('name', `${v.first ?? ''} ${v.last ?? ''}`.trim());
        fd.append('company', v.company ?? '');
        fd.append('email', v.email ?? '');
        fd.append('phone', v.phone ? (v.phone_pre ?? '+49') ? `${v.phone_pre ?? '+49'} ${v.phone.trim().replace(/^0/, '')}` : v.phone.trim() : '');
        fd.append('category', v.category ?? '');
        fd.append('qty', v.qty ?? '');
        fd.append('deco', v.deco ?? '');
        fd.append('message', v.message ?? '');
        if (v.sample === 'on') fd.append('sample', 'on');
        if (v.privacy === 'on') fd.append('privacy', 'on');
        if (files.logo) fd.append('logo', files.logo);
        const r = await fetch('/api/preisanfrage', { method: 'POST', body: fd });
        const d = await r.json().catch(() => ({}));
        return r.ok ? null : d.error ?? 'Senden fehlgeschlagen.';
      }} />
  );
}
