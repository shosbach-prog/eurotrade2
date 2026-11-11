'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateInvoice({ no, label }: { no: string; label: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  return <button className="btn sm" disabled={busy} onClick={async () => {
    setBusy(true);
    const r = await fetch('/api/admin/rechnungen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'new', inquiryNo: no }) });
    const d = await r.json().catch(() => ({})); if (d.id) router.push(`/admin/rechnungen/${d.id}`); else setBusy(false);
  }}>{busy ? 'Erstellt …' : label}</button>;
}
