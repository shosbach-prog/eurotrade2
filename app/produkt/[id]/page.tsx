import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import AddToCart from './AddToCart';
import { getPricing } from '@/lib/deco-pricing-store';
import { anchorsFor, fitsFor } from '@/lib/image-fit';
import { isAdmin } from '@/lib/customer';
import { gpsrFor } from '@/lib/gpsr';
import { sizeTableFor } from '@/lib/groessen';
import { getTeamShop, isOpen, logoChoices, rankedMotifs, teamFixedPrice } from '@/lib/teamshop';
import { gross } from '@/lib/pricing';
import ProductCard from '@/components/ProductCard';
import { getByCategory, getProduct, matchingFor, pictosOf } from '@/lib/catalog';
import { refsFor } from '@/lib/store';
import RefStrip from '@/components/RefStrip';
import { viewCtx } from '@/lib/customer';
import { RecentTracker, RecentlyViewed } from '@/components/Recent';
import ProductReviews from '@/components/ProductReviews';
import { getText } from '@/lib/content';
import JsonLd, { crumbSchema } from '@/components/JsonLd';
import { productPath, catPath } from '@/lib/format';

export async function generateMetadata({ params }: { params: { id: string; cat?: string } }) {
  const p = getProduct(decodeURIComponent(params.id), await viewCtx());
  return p ? { title: `${p.name} – ${p.brand}`, description: getText(p).text.intro.slice(0, 155), alternates: { canonical: productPath(p) }, openGraph: { title: `${p.name} – ${p.brand}`, images: p.images.slice(0, 1) } } : {};
}

export default async function ProductPage({ params, searchParams }: { params: { id: string; cat?: string }; searchParams?: { team?: string; motiv?: string; logo?: string } }) {
  const ctx = await viewCtx();
  const p0 = getProduct(decodeURIComponent(params.id), ctx);
  if (!p0) notFound();
  // alte/abweichende URLs (z. B. /produkt/bcpu427) dauerhaft auf die sprechende URL umleiten
  if (`/${params.cat ?? 'produkt'}/${decodeURIComponent(params.id)}` !== productPath(p0)) permanentRedirect(`${productPath(p0)}${searchParams?.team ? `?team=${encodeURIComponent(String(searchParams.team))}${searchParams?.motiv ? `&motiv=${encodeURIComponent(String(searchParams.motiv))}` : ''}` : ''}`);
  const ts = searchParams?.team ? getTeamShop(String(searchParams.team)) : null;
  // Team-Shop: Mitglieder sehen Preise auch ohne Zugangscode
  const p1 = ts && ts.items.includes(p0.id) && ctx && 'locked' in ctx ? getProduct(decodeURIComponent(params.id), null) ?? p0 : p0;
  const inShop = !!ts && ts.items.includes(p1.id);
  // Motiv-Shop: gewähltes Motiv (?motiv=…) wird als Logo gesetzt, Festpreis inkl. Druck
  const motifs = inShop && ts!.motifs?.length ? rankedMotifs(ts!).map((m) => ({ id: m.id, name: m.name })) : null;
  const mot = motifs ? motifs.find((m) => m.id === searchParams?.motiv) ?? motifs[0] : null;
  const fixed = inShop ? teamFixedPrice(ts, p1.id) : null;
  const p = fixed != null && !p1.locked ? { ...p1, price: fixed, priceGross: gross(fixed), tiers: [], was: null, sale: undefined } : p1;
  const logos = inShop && !motifs ? logoChoices(ts) : [];
  const lg = logos.length ? logos.find((l) => l.id === searchParams?.logo) ?? logos[0] : null;
  const team = inShop ? { slug: ts!.slug, name: ts!.name, logoId: mot?.id ?? lg?.id ?? ts!.logoId, logoName: mot ? `Motiv: ${mot.name}` : lg ? lg.name : ts!.logoName, method: ts!.method, positions: ts!.positions, personalize: ts!.personalize, deadline: ts!.deadline, open: isOpen(ts!), ...(motifs ? { motifs } : {}), ...(logos.length ? { logos } : {}), ...(fixed != null && ts!.backPrice && ts!.logoId ? { back: { price: ts!.backPrice, id: ts!.logoId, name: (ts!.logoName ?? ts!.name).replace(/\.[^.]+$/, '') } } : {}), ...(fixed != null ? { fixed: true } : {}) } : null;
  const match = matchingFor(p.id, ctx);
  const shownIds = new Set([...match.variants, ...match.combos].map((x) => x.id));
  const related = getByCategory(p.categorySlug, ctx).filter((x) => x.id !== p.id && !shownIds.has(x.id)).slice(0, 8);
  const refs = team ? [] : refsFor(p);
  return (
    <>
      <div className="crumbs">{team ? <><Link href={`/team/${team.slug}`}>← Team-Shop {team.name}</Link></> : <><Link href="/">Start</Link> › <Link href={catPath(p.categorySlug)}>{p.category}</Link> › {p.name}</>}</div>
      <AddToCart key={mot?.id ?? lg?.id ?? 'x'} p={p} team={team} pictos={pictosOf(p.id)} gpsr={gpsrFor(p.brand)} sizeTable={sizeTableFor(p.sku)} fits={fitsFor(p)} anchors={anchorsFor(p)} admin={await isAdmin()} pricing={(() => { const pr = getPricing(); return pr.showEstimate && !p.locked && fixed == null ? pr : null; })()} customerLogo={ctx && 'code' in ctx && ctx.logoId ? { id: ctx.logoId, name: ctx.logoName ?? 'Ihr Logo' } : null} copy={getText(p).text} delivery={process.env.DELIVERY_TEXT ?? 'Lieferung ca. 3–5 Werktage · mit Veredelung ca. 7–14 Werktage nach Freigabe'} />
      <JsonLd data={crumbSchema([['Start', '/'], [p.category, catPath(p.categorySlug)], [p.name, productPath(p)]])} />
      {!p.rating && <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, brand: { '@type': 'Brand', name: p.brand }, image: p.images.slice(0, 4).map((u) => (u.startsWith('/') ? `${(process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '')}${u}` : u)), description: getText(p).text.intro, color: p.colors.map((c) => c.name).join(', '), material: p.composition || p.material }} />}
      {match.variants.length > 0 && <><h2>Gleicher Artikel – anderer Schnitt</h2><p className="muted" style={{ marginTop: -8 }}>Ideal für gemischte Teams: Damen-, Herren- und Kinder-Variante im gleichen Look.</p><div className="grid">{match.variants.map((r) => <ProductCard key={r.id} p={r} />)}</div></>}
      {match.combos.length > 0 && <><h2>Passt dazu</h2><p className="muted" style={{ marginTop: -8 }}>Komplettes Outfit mit gleichem Logo – mehr Teile, bessere Staffelpreise bei der Veredelung.</p><div className="grid">{match.combos.map((r) => <ProductCard key={r.id} p={r} />)}</div></>}
      <RefStrip refs={refs} />
      <RecentTracker id={p.id} />
      <ProductReviews productId={p.id} name={p.name} />
      {related.length > 0 && <><h2>Ähnliche Artikel</h2><div className="grid">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></>}
      <RecentlyViewed exclude={p.id} />
    </>
  );
}
