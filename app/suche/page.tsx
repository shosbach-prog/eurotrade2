import ProductCard from '@/components/ProductCard';
import { search } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';

export function generateMetadata({ searchParams }: { searchParams: { q?: string } }) {
  return { title: `Suche: ${searchParams.q ?? ''}`, robots: { index: false } };
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? '').trim();
  const res = q ? search(q, 200, await getCustomer()) : [];
  return (
    <>
      <h1>{q ? <>Ergebnisse für „{q}“</> : 'Suche'}</h1>
      <p className="muted">{res.length} Treffer</p>
      {res.length ? <div className="grid">{res.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        : q && <p>Nichts gefunden. Probieren Sie einen allgemeineren Begriff, z. B. „Shirt“, „Hoodie“ oder „Tasche“.</p>}
    </>
  );
}
