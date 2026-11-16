import { notFound } from 'next/navigation';
import ProductPage, { generateMetadata as meta } from '../../produkt/[id]/page';
import { RESERVED_TOP } from '@/lib/format';

type Props = { params: Promise<{ cat: string; slug: string }>; searchParams?: Promise<{ team?: string }> };

/** Artikelseite unter /<kategorie>/<artikelname> */
export async function generateMetadata(props: Props) {
  const params = await props.params;
  if (RESERVED_TOP.includes(params.cat)) return {};
  return meta({ params: Promise.resolve({ id: params.slug, cat: params.cat }) });
}
export default async function CatProduct(props: Props) {
  const params = await props.params;
  if (RESERVED_TOP.includes(params.cat) || !/^[a-z0-9-]+$/.test(params.cat)) notFound();
  return ProductPage({ params: Promise.resolve({ id: params.slug, cat: params.cat }), searchParams: props.searchParams });
}
