import type { Metadata } from 'next';
import CartClient from './CartClient';
import ContactCard from '@/components/ContactCard';
import { getPricing } from '@/lib/deco-pricing-store';
import { paypalEnabled } from '@/lib/paypal';
import { VAT } from '@/lib/pricing';

export const metadata: Metadata = { title: 'Warenkorb', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function CartPage({ searchParams }: { searchParams?: { teilen?: string } }) {
  return <CartClient share={searchParams?.teilen ?? null} remind={getPricing().remind?.cart !== false} contact={<ContactCard compact />} shop={{ ship: Number(process.env.SHIPPING_GROSS ?? 4.9), paypal: paypalEnabled(), vat: VAT }} />;
}
