import { notFound, permanentRedirect } from 'next/navigation';
import CategoryView, { generateMetadata as meta } from '../kategorie/[slug]/view';
import { RESERVED_TOP } from '@/lib/format';
import { kollektionByAlias, kollektionBySlug } from '@/lib/kollektionen';
import CollectionView, { collectionMeta } from '../kollektion/view';

type Props = { params: { cat: string }; searchParams?: Record<string, string> };

/** Kategorie-, Unterkategorie- und Zielgruppen-Seiten direkt unter /<slug> */
export async function generateMetadata({ params }: Props) {
  if (RESERVED_TOP.includes(params.cat)) return {};
  if (kollektionBySlug(params.cat)) return collectionMeta(params.cat);
  return meta({ params: { slug: params.cat } });
}
export default function Kategorie({ params, searchParams }: Props) {
  if (RESERVED_TOP.includes(params.cat) || !/^[a-z0-9-]+$/.test(params.cat)) notFound();
  const alt = kollektionByAlias(params.cat);
  if (alt) permanentRedirect(`/${alt.slug}`);
  if (kollektionBySlug(params.cat)) return CollectionView({ slug: params.cat, searchParams });
  return CategoryView({ params: { slug: params.cat }, searchParams });
}
