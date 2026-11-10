import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { getByCategory, getCategories } from '@/lib/catalog';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = getCategories().find((x) => x.slug === params.slug);
  return { title: c?.name ?? 'Kategorie' };
}

export default function CategoryPage({ params, searchParams }: { params: { slug: string }; searchParams: { sort?: string } }) {
  const cat = getCategories().find((x) => x.slug === params.slug);
  if (!cat) notFound();
  let items = getByCategory(params.slug);
  if (searchParams.sort === 'preis') items = [...items].sort((a, b) => (a.price ?? 1e9) - (b.price ?? 1e9));
  if (searchParams.sort === 'preis-ab') items = [...items].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  return (
    <>
      <div className="crumbs"><Link href="/">Start</Link> › {cat.name}</div>
      <h1>{cat.name}</h1>
      <div className="chips" style={{ margin: '0 0 16px' }}>
        <span className="muted" style={{ alignSelf: 'center' }}>{items.length} Artikel · Sortieren:</span>
        <Link className="chip" href={`?`}>Empfohlen</Link>
        <Link className="chip" href={`?sort=preis`}>Preis ↑</Link>
        <Link className="chip" href={`?sort=preis-ab`}>Preis ↓</Link>
      </div>
      <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </>
  );
}
