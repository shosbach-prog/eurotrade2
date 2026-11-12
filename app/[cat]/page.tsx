import { notFound } from 'next/navigation';
import CategoryView, { generateMetadata as meta } from '../kategorie/[slug]/view';
import { RESERVED_TOP } from '@/lib/format';

type Props = { params: { cat: string }; searchParams?: Record<string, string> };

/** Kategorie-, Unterkategorie- und Zielgruppen-Seiten direkt unter /<slug> */
export async function generateMetadata({ params }: Props) {
  if (RESERVED_TOP.includes(params.cat)) return {};
  return meta({ params: { slug: params.cat } });
}
export default function Kategorie({ params, searchParams }: Props) {
  if (RESERVED_TOP.includes(params.cat) || !/^[a-z0-9-]+$/.test(params.cat)) notFound();
  return CategoryView({ params: { slug: params.cat }, searchParams });
}
