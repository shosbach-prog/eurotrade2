import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getCategories, getCollection, getFeatured, productCount } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';
import { RecentlyViewed } from '@/components/Recent';
import NewsletterBox from './start/NewsletterBox';
import { ReviewStrip } from '@/components/ProductReviews';
import { latestReviews, overall } from '@/lib/reviews';
import { discountTiers } from '@/lib/store';

export default async function Home() {
  const ctx = await getCustomer();
  const cats = getCategories(ctx);
  const collection = getCollection(ctx);
  return (
    <>
      <section className="hero">
        <div>
          <h1>{ctx ? <>Willkommen, {ctx.name}</> : 'Markentextilien ab 1 Stück'}</h1>
          <p>{productCount(ctx).toLocaleString('de-DE')} Artikel · schon ab 1 Stück · auf Wunsch mit Druck oder Stick</p>
          <div className="chips">{cats.map((c) => <Link key={c.slug} className="chip" href={`/kategorie/${c.slug}`}>{c.name}</Link>)}</div>
        </div>
      </section>
      <RecentlyViewed />
      {collection.length > 0 && <>
        <h2>Ihre Kollektion</h2>
        <div className="grid">{collection.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </>}
      {!(ctx?.exclusive && collection.length) && <>
        <h2>{collection.length ? 'Weitere Artikel' : 'Beliebte Artikel'}</h2>
        <div className="grid">{getFeatured(16, ctx).filter((p) => !collection.some((c) => c.id === p.id)).map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </>}
      <ReviewStrip reviews={latestReviews(6)} overall={overall()} />
      <div style={{ marginTop: 40 }}><NewsletterBox tiers={discountTiers()} /></div>
    </>
  );
}
