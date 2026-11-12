import { notFound } from 'next/navigation';
import ProductPage, { generateMetadata as meta } from '../../produkt/[id]/page';
import { RESERVED_TOP } from '@/lib/format';

type Props = { params: { cat: string; slug: string }; searchParams?: { team?: string } };

/** Artikelseite unter /<kategorie>/<artikelname> */
export async function generateMetadata({ params }: Props) {
  if (RESERVED_TOP.includes(params.cat)) return {};
  return meta({ params: { id: params.slug, cat: params.cat } });
}
export default function CatProduct({ params, searchParams }: Props) {
  if (RESERVED_TOP.includes(params.cat) || !/^[a-z0-9-]+$/.test(params.cat)) notFound();
  return ProductPage({ params: { id: params.slug, cat: params.cat }, searchParams });
}
