import type { Metadata } from 'next';
import CartClient from './CartClient';
import ContactCard from '@/components/ContactCard';
import { getPricing } from '@/lib/deco-pricing-store';

export const metadata: Metadata = { title: 'Warenkorb & Anfrage', robots: { index: false, follow: false } };
export default function CartPage({ searchParams }: { searchParams?: { teilen?: string } }) {
  return <CartClient share={searchParams?.teilen ?? null} remind={getPricing().remind?.cart !== false} contact={<ContactCard compact />} />;
}
