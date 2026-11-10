import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCart from './AddToCart';
import ProductCard from '@/components/ProductCard';
import { getByCategory, getProduct } from '@/lib/catalog';

export function generateMetadata({ params }: { params: { id: string } }) {
  const p = getProduct(decodeURIComponent(params.id));
  return p ? { title: p.name, description: p.description.slice(0, 155) } : {};
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const p = getProduct(decodeURIComponent(params.id));
  if (!p) notFound();
  const related = getByCategory(p.categorySlug).filter((x) => x.id !== p.id).slice(0, 8);
  return (
    <>
      <div className="crumbs"><Link href="/">Start</Link> › <Link href={`/kategorie/${p.categorySlug}`}>{p.category}</Link> › {p.name}</div>
      <AddToCart p={p} />
      {related.length > 0 && <><h2>Ähnliche Artikel</h2><div className="grid">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></>}
    </>
  );
}
