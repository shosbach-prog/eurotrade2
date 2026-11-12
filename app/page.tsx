import { catPath } from '@/lib/format';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { categoryTiles, getCategories, getCollection, getFeatured, newArrivals, productCount, slimCard } from '@/lib/catalog';
import CategoryTiles from '@/components/CategoryTiles';
import SeasonBanner from '@/components/SeasonBanner';
import { getCustomer } from '@/lib/customer';
import { RecentlyViewed } from '@/components/Recent';
import NewsletterBox from './start/NewsletterBox';
import { ReviewStrip } from '@/components/ProductReviews';
import { latestReviews, overall } from '@/lib/reviews';
import { discountTiers } from '@/lib/store';
import HeroProducts from '@/components/HeroProducts';
import { heroItems } from '@/lib/hero';
import BrandStrip from '@/components/BrandStrip';
import { brandList } from '@/lib/brand-catalog';

export default async function Home() {
  const ctx = await getCustomer();
  const cats = getCategories(ctx);
  const collection = getCollection(ctx);
  const hero = heroItems(collection.length ? [...collection, ...getFeatured(12, ctx)].filter((p, k, a) => a.findIndex((x) => x.id === p.id) === k) : getFeatured(12, ctx), { link: true });
  return (
    <>
      <section className="hero hero-shop">
        <div className="hero-text">
          <h1>{ctx ? <>Willkommen, {ctx.name}</> : 'Markentextilien ab 1 Stück'}</h1>
          <p>{productCount(ctx).toLocaleString('de-DE')} Artikel · schon ab 1 Stück · auf Wunsch mit Druck oder Stick</p>
          <div className="chips">{cats.map((c) => <Link key={c.slug} className="chip" href={catPath(c.slug)}>{c.name}</Link>)}</div>
        </div>
        {hero.length > 0 && <HeroProducts items={hero} />}
      </section>
      <SeasonBanner />
      <RecentlyViewed />
      {collection.length > 0 && <>
        <h2>Ihre Kollektion</h2>
        <div className="grid">{collection.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </>}
      {!(ctx?.exclusive && collection.length) && <>
        <h2>{collection.length ? 'Weitere Artikel' : 'Beliebte Artikel'}</h2>
        <div className="grid">{getFeatured(16, ctx).filter((p) => !collection.some((c) => c.id === p.id)).map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </>}
      {!ctx?.exclusive && (() => {
        const neu = newArrivals(10, ctx);
        const tiles = categoryTiles(ctx, ['taschen-rucksaecke', 'caps-muetzen', 'gastro-kueche', 'warnschutz', 'schirme', 'pluesch-spielzeug', 'handtuecher', 'decken']).filter((t) => t.count > 0);
        return <>
          {tiles.length > 0 && <section className="home-sec"><div className="home-h"><h2>Mehr als Textil: neu im Sortiment</h2><p className="muted">Taschen, Caps, Gastro, Warnschutz, Schirme und Werbeartikel – alles mit Ihrem Logo.</p></div><CategoryTiles tiles={tiles} link /></section>}
          {neu.length > 0 && <section className="home-sec"><div className="home-h"><h2>Neu eingetroffen</h2></div><div className="grid">{neu.map((p) => <ProductCard key={p.id} p={slimCard(p)} />)}</div></section>}
        </>;
      })()}
      <BrandStrip brands={brandList(ctx)} />
      <ReviewStrip reviews={latestReviews(6)} overall={overall()} />
      <div style={{ marginTop: 40 }}><NewsletterBox tiers={discountTiers()} /></div>
    </>
  );
}
