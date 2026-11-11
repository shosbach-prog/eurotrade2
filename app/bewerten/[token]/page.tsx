import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReviewForm from './ReviewForm';
import { inquiryByToken, listReviews } from '@/lib/store';

export const metadata: Metadata = { title: 'Bewertung abgeben', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function Bewerten({ params }: { params: { token: string } }) {
  const i = inquiryByToken(params.token);
  if (!i || !['angenommen', 'bestellt', 'geliefert'].includes(i.status ?? '')) notFound();
  const products = [...new Map(i.lines.filter((l) => l.id).map((l) => [l.id!, { id: l.id!, name: l.name, sku: l.sku }])).values()];
  const existing = listReviews().filter((r) => r.inquiryNo === i.no);
  const first = i.customer.name.trim().split(/\s+/);
  const display = first.length > 1 ? `${first[0]} ${first[first.length - 1][0]}.` : first[0];
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h1>Ihre Bewertung</h1>
      <p className="muted" style={{ marginTop: -6 }}>Auftrag {i.no} · Vielen Dank, dass Sie sich einen Moment Zeit nehmen.</p>
      <ReviewForm token={params.token} products={products} defaultName={display} company={i.customer.company ?? ''} done={existing.length > 0} />
    </div>
  );
}
