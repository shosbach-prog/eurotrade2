import { isAdmin } from '@/lib/customer';
import { offerPdf } from '@/lib/pdf';
import { getInquiry } from '@/lib/store';

export async function GET(_: Request, { params }: { params: { no: string } }) {
  if (!(await isAdmin())) return new Response('Nicht angemeldet', { status: 401 });
  const i = getInquiry(params.no);
  if (!i?.offer) return new Response('Noch kein Angebot gespeichert', { status: 404 });
  return new Response(await offerPdf(i), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="Angebot-${i.no}.pdf"` } });
}
