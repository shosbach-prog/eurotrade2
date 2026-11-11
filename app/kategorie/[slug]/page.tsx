import Link from 'next/link';
import { notFound } from 'next/navigation';
import FilterGrid from '@/components/FilterGrid';
import { getByCategory, getCategories } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const c = getCategories(await getCustomer()).find((x) => x.slug === params.slug);
  return { title: c?.name ?? 'Kategorie' };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const ctx = await getCustomer();
  const cat = getCategories(ctx).find((x) => x.slug === params.slug);
  if (!cat) notFound();
  return (
    <>
      <div className="crumbs"><Link href="/">Start</Link> › {cat.name}</div>
      <h1>{cat.name}</h1>
      <FilterGrid items={getByCategory(params.slug, ctx)} />
    </>
  );
}
