import Stars from './Stars';
import { ReviewCard, ReviewNote } from './ReviewList';
import { reviewsFor } from '@/lib/reviews';

/** Bewertungsbereich auf der Produktseite */
export default function ProductReviews({ productId, name }: { productId: string; name: string }) {
  const list = reviewsFor(productId);
  if (!list.length) return (
    <section id="bewertungen" className="rev-section">
      <h2>Bewertungen</h2>
      <div className="box muted">Für diesen Artikel gibt es noch keine Bewertungen. Nach Ihrer Bestellung laden wir Sie ein, als Erste/r zu bewerten.</div>
    </section>
  );
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: list.filter((r) => r.rating === n).length }));
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name, aggregateRating: { '@type': 'AggregateRating', ratingValue: avg.toFixed(1), reviewCount: list.length }, review: list.slice(0, 5).map((r) => ({ '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: r.rating }, author: { '@type': 'Person', name: r.name }, datePublished: r.date.slice(0, 10), reviewBody: r.text })) };
  return (
    <section id="bewertungen" className="rev-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h2>Bewertungen</h2>
      <div className="rev-grid">
        <div className="box rev-sum">
          <div className="rev-big">{avg.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
          <Stars value={avg} size={20} />
          <div className="muted" style={{ fontSize: 13 }}>{list.length} verifizierte {list.length === 1 ? 'Bewertung' : 'Bewertungen'}</div>
          <div className="rev-dist">{dist.map(({ n, c }) => <div key={n}><span>{n} ★</span><i><b style={{ width: `${(c / list.length) * 100}%` }} /></i><span>{c}</span></div>)}</div>
        </div>
        <div className="rev-list">{list.slice(0, 20).map((r) => <ReviewCard key={r.id} r={r} />)}</div>
      </div>
      <ReviewNote />
    </section>
  );
}

/** Kundenstimmen (Startseite/Kategorie) */
export function ReviewStrip({ reviews, overall, title = 'Das sagen unsere Kunden' }: { reviews: import('@/lib/store').Review[]; overall: { avg: number; count: number } | null; title?: string }) {
  if (!reviews.length || !overall) return null;
  return (
    <section className="rev-section">
      <div className="list-head" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <span className="rev-overall"><Stars value={overall.avg} size={18} showValue count={overall.count} /></span>
      </div>
      <div className="rev-strip">{reviews.map((r) => <ReviewCard key={r.id} r={r} showProduct />)}</div>
      <ReviewNote />
    </section>
  );
}
