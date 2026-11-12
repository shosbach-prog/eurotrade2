import { permanentRedirect } from 'next/navigation';
import CategoryView, { generateMetadata as meta } from './view';
import { RESERVED_TOP } from '@/lib/format';

type Props = { params: { slug: string }; searchParams?: Record<string, string> };

export const generateMetadata = (props: Props) => meta(props);

/** Alte Adresse /kategorie/x → /x (außer der Name ist eine feste Seite) */
export default function KategorieAlt({ params, searchParams }: Props) {
  if (!RESERVED_TOP.includes(params.slug)) {
    const q = new URLSearchParams(searchParams ?? {}).toString();
    permanentRedirect(`/${params.slug}${q ? `?${q}` : ''}`);
  }
  return CategoryView({ params, searchParams });
}
