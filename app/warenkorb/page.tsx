import type { Metadata } from 'next';
import CartClient from './CartClient';
import ContactCard from '@/components/ContactCard';

export const metadata: Metadata = { title: 'Warenkorb & Anfrage', robots: { index: false, follow: false } };
export default function CartPage({ searchParams }: { searchParams?: { teilen?: string } }) {
  return <CartClient share={searchParams?.teilen ?? null} contact={<ContactCard compact />} />;
}
