import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import CustomerManager from './CustomerManager';
import { allProductsBrief } from '@/lib/catalog';
import { allCustomers, listAccessRequests, publicCustomer } from '@/lib/store';
import { mailEnabled } from '@/lib/mail';
import { defaultTiers } from '@/lib/pricing';
import { tiersToString } from '@/lib/tiers';

export const metadata: Metadata = { title: 'Kunden', robots: { index: false, follow: false } };

export default function Kunden() {
  const list = allCustomers();
  return (
    <>
      <AdminNav active="kunden" />
      <CustomerManager initial={list.filter((c) => c.source === 'admin' && !(c.pending && c.active === false)).map((c) => ({ ...publicCustomer(c), _orig: c.code }))} mail={mailEnabled()} envCodes={list.filter((c) => c.source === 'env').map((c) => ({ code: c.code, name: c.name }))} products={allProductsBrief()} defaultMarkup={Number(process.env.MARKUP_PERCENT ?? 35)} defaultTiers={tiersToString(defaultTiers())} requests={listAccessRequests().filter((r) => !r.done).reverse()} />
    </>
  );
}
