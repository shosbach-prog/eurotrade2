import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCart from './AddToCart';
import ProductCard from '@/components/ProductCard';
import { getByCategory, getProduct } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';
import { RecentTracker, RecentlyViewed } from '@/components/Recent';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = getProduct(decodeURIComponent(params.id), await getCustomer());
  return p ? { title: p.name, description: p.description.slice(0, 155) } : {};
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const ctx = await getCustomer();
  const p = getProduct(decodeURIComponent(params.id), ctx);
  if (!p) notFound();
  const related = getByCategory(p.categorySlug, ctx).filter((x) => x.id !== p.id).slice(0, 8);
  return (
    <>
      <div className="crumbs"><Link href="/">Start</Link> › <Link href={`/kategorie/${p.categorySlug}`}>{p.category}</Link> › {p.name}</div>
      <AddToCart p={p} customerLogo={ctx?.logoId ? { id: ctx.logoId, name: ctx.logoName ?? 'Ihr Logo' } : null} delivery={process.env.DELIVERY_TEXT ?? 'Lieferung ca. 3–5 Werktage · mit Veredelung ca. 7–14 Werktage nach Freigabe'} />
      <RecentTracker id={p.id} />
      {related.length > 0 && <><h2>Ähnliche Artikel</h2><div className="grid">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></>}
      <RecentlyViewed exclude={p.id} />
    </>
  );
}
