import Link from 'next/link';
import FilterGrid from '@/components/FilterGrid';
import { didYouMean, getCategories, search, slimCard } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';

export function generateMetadata({ searchParams }: { searchParams: { q?: string } }) {
  return { title: `Suche: ${searchParams.q ?? ''}`, robots: { index: false } };
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const ctx = await getCustomer();
  const q = (searchParams.q ?? '').trim();
  const res = q ? search(q, 200, ctx) : [];
  const sug = q && !res.length ? didYouMean(q, ctx) : null;
  return (
    <>
      <h1>{q ? <>Ergebnisse für „{q}“</> : 'Suche'}</h1>
      {res.length ? <FilterGrid items={res.map(slimCard)} /> : q && (
        <div className="box">
          {sug ? <p style={{ marginTop: 0, fontSize: 17 }}>Meinten Sie <Link className="alink" href={`/suche?q=${encodeURIComponent(sug)}`}>„{sug}“</Link>?</p>
            : <p style={{ marginTop: 0 }}>Leider nichts gefunden.</p>}
          <p className="muted">Probieren Sie einen allgemeineren Begriff oder stöbern Sie in den Kategorien:</p>
          <div className="chips">{getCategories(ctx).map((c) => <Link key={c.slug} className="chip" href={`/kategorie/${c.slug}`}>{c.name}</Link>)}</div>
        </div>
      )}
    </>
  );
}
