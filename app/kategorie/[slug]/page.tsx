import { permanentRedirect } from 'next/navigation';
import CategoryView, { generateMetadata as meta } from './view';
import { RESERVED_TOP } from '@/lib/format';

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<Record<string, string>> };

export const generateMetadata = async (props: Props) => meta({ params: await props.params });

/** Alte Adresse /kategorie/x → /x (außer der Name ist eine feste Seite) */
export default async function KategorieAlt(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  if (!RESERVED_TOP.includes(params.slug)) {
    const q = new URLSearchParams(searchParams ?? {}).toString();
    permanentRedirect(`/${params.slug}${q ? `?${q}` : ''}`);
  }
  return CategoryView({ params, searchParams });
}
