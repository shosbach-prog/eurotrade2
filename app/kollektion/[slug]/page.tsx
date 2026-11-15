import { notFound, permanentRedirect } from 'next/navigation';
import { kollektionByAlias, kollektionBySlug } from '@/lib/kollektionen';

/** /kollektion/satire → /satire */
export default function KollektionRedirect({ params }: { params: { slug: string } }) {
  const k = kollektionBySlug(params.slug) ?? kollektionByAlias(params.slug);
  if (!k) notFound();
  permanentRedirect(`/${k.slug}`);
}
