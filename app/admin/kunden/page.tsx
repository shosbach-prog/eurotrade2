import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import CustomerEditor from './CustomerEditor';
import { allProductsBrief } from '@/lib/catalog';
import { allCustomers } from '@/lib/store';

export const metadata: Metadata = { title: 'Kunden & Codes', robots: { index: false, follow: false } };

export default function Kunden() {
  const list = allCustomers();
  return (
    <>
      <AdminNav active="kunden" />
      <h1>Kunden & Zugangscodes</h1>
      <p className="muted" style={{ marginTop: -8 }}>Jeder Code öffnet den Shop. Pro Kunde: eigener Aufschlag, eigene Kollektion und hinterlegtes Logo. Standard-Aufschlag: {process.env.MARKUP_PERCENT ?? 35} %.</p>
      <CustomerEditor initial={list.filter((c) => c.source === 'admin')} envCodes={list.filter((c) => c.source === 'env').map((c) => ({ code: c.code, name: c.name }))} products={allProductsBrief()} defaultMarkup={Number(process.env.MARKUP_PERCENT ?? 35)} />
    </>
  );
}
