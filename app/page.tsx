import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getCategories, getFeatured, productCount } from '@/lib/catalog';

export default function Home() {
  const cats = getCategories();
  return (
    <>
      <section className="hero">
        <div>
          <h1>Textilien für Druck & Stick</h1>
          <p>{productCount().toLocaleString('de-DE')} Artikel · Warenkorb füllen · unverbindliches Angebot in 24 h</p>
          <div className="chips">{cats.map((c) => <Link key={c.slug} className="chip" href={`/kategorie/${c.slug}`}>{c.name}</Link>)}</div>
        </div>
      </section>
      <h2>Beliebte Artikel</h2>
      <div className="grid">{getFeatured(16).map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </>
  );
}
