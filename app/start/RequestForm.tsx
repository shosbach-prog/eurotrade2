'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import StepForm, { type Step } from '@/components/StepForm';

/** Zugang zum Shop anfragen – Schritt für Schritt */
export default function RequestForm({ aside }: { aside?: ReactNode }) {
  const steps: Step[] = [
    { title: 'Tragen Sie hier Ihre Kontaktinformationen ein:', fields: [
      { kind: 'text', name: 'first', label: 'Vorname', placeholder: 'Max', required: true, autoComplete: 'given-name' },
      { kind: 'text', name: 'last', label: 'Nachname', placeholder: 'Mustermann', required: true, autoComplete: 'family-name' },
      { kind: 'tel', name: 'phone', label: 'Telefonnummer', placeholder: '01512 3456789' },
      { kind: 'email', name: 'email', label: 'E-Mail', placeholder: 'name@beispiel.de', required: true, autoComplete: 'email' },
      { kind: 'text', name: 'company', label: 'Unternehmen / Verein', placeholder: 'Meyer & Söhne', autoComplete: 'organization' },
    ] },
    { title: 'Wer sind Sie?', fields: [{ kind: 'choice', name: 'type', options: ['Verein', 'Unternehmen', 'Handwerk', 'Gastronomie / Hotel', 'Schule / Kita', 'Event / Agentur', 'Privat', 'Sonstiges'], required: true }] },
    { title: 'Was haben Sie vor?', fields: [
      { kind: 'textarea', name: 'message', label: 'Vorhaben (optional)', placeholder: 'z. B. 40 Hoodies mit Vereinslogo, Polos für das Team …' },
      { kind: 'check', name: 'privacy', required: true, label: <>Ich stimme der Verarbeitung meiner Daten gemäß <Link href="/datenschutz" style={{ textDecoration: 'underline' }}>Datenschutzerklärung</Link> zu.</> },
    ] },
  ];
  return (
    <StepForm steps={steps} aside={aside} submitLabel="Zugang anfragen"
      done={<><span className="qf-ok">✓</span><h3>Vielen Dank!</h3><p>Wir melden uns innerhalb von 24 Stunden mit Ihrem persönlichen Zugang.</p></>}
      onSubmit={async (v) => {
        const r = await fetch('/api/zugang-anfrage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          name: `${v.first ?? ''} ${v.last ?? ''}`.trim(), company: v.company ?? '', email: v.email ?? '',
          phone: v.phone ? (v.phone_pre ?? '+49') ? `${v.phone_pre ?? '+49'} ${v.phone.trim().replace(/^0/, '')}` : v.phone.trim() : '', type: v.type ?? '', message: v.message ?? '', privacy: v.privacy === 'on',
        }) });
        const d = await r.json().catch(() => ({}));
        return r.ok ? null : d.error ?? 'Senden fehlgeschlagen.';
      }} />
  );
}
