import { notFound, permanentRedirect } from 'next/navigation';
import { kollektionByAlias, kollektionBySlug } from '@/lib/kollektionen';

/** /kollektion/satire → /satire */
export default async function KollektionRedirect(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const k = kollektionBySlug(params.slug) ?? kollektionByAlias(params.slug);
  if (!k) notFound();
  permanentRedirect(`/${k.slug}`);
}
