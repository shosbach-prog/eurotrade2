import { notFound, permanentRedirect } from 'next/navigation';
import { kollektionBySlug } from '@/lib/kollektionen';

/** /kollektion/satire → /satire */
export default function KollektionRedirect({ params }: { params: { slug: string } }) {
  const k = kollektionBySlug(params.slug);
  if (!k) notFound();
  permanentRedirect(`/${k.slug}`);
}
