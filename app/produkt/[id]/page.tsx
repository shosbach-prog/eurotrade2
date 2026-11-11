import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCart from './AddToCart';
import { getPricing } from '@/lib/deco-pricing-store';
import { fitsFor } from '@/lib/image-fit';
import ProductCard from '@/components/ProductCard';
import { getByCategory, getProduct } from '@/lib/catalog';
import { viewCtx } from '@/lib/customer';
import { RecentTracker, RecentlyViewed } from '@/components/Recent';
import ProductReviews from '@/components/ProductReviews';
import { getText } from '@/lib/content';
import JsonLd, { crumbSchema } from '@/components/JsonLd';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = getProduct(decodeURIComponent(params.id), await viewCtx());
  return p ? { title: `${p.name} – ${p.brand}`, description: getText(p).text.intro.slice(0, 155), alternates: { canonical: `/produkt/${p.id}` }, openGraph: { title: `${p.name} – ${p.brand}`, images: p.images.slice(0, 1) } } : {};
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const ctx = await viewCtx();
  const p = getProduct(decodeURIComponent(params.id), ctx);
  if (!p) notFound();
  const related = getByCategory(p.categorySlug, ctx).filter((x) => x.id !== p.id).slice(0, 8);
  return (
    <>
      <div className="crumbs"><Link href="/">Start</Link> › <Link href={`/kategorie/${p.categorySlug}`}>{p.category}</Link> › {p.name}</div>
      <AddToCart p={p} fits={fitsFor(p)} pricing={(() => { const pr = getPricing(); return pr.showEstimate && !p.locked ? pr : null; })()} customerLogo={ctx && 'code' in ctx && ctx.logoId ? { id: ctx.logoId, name: ctx.logoName ?? 'Ihr Logo' } : null} copy={getText(p).text} delivery={process.env.DELIVERY_TEXT ?? 'Lieferung ca. 3–5 Werktage · mit Veredelung ca. 7–14 Werktage nach Freigabe'} />
      <JsonLd data={crumbSchema([['Start', '/'], [p.category, `/kategorie/${p.categorySlug}`], [p.name, `/produkt/${p.id}`]])} />
      {!p.rating && <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, brand: { '@type': 'Brand', name: p.brand }, image: p.images.slice(0, 4).map((u) => (u.startsWith('/') ? `${(process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '')}${u}` : u)), description: getText(p).text.intro, color: p.colors.map((c) => c.name).join(', '), material: p.composition || p.material }} />}
      <RecentTracker id={p.id} />
      <ProductReviews productId={p.id} name={p.name} />
      {related.length > 0 && <><h2>Ähnliche Artikel</h2><div className="grid">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></>}
      <RecentlyViewed exclude={p.id} />
    </>
  );
}
