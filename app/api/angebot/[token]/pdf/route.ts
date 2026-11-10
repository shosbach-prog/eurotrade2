import { offerPdf } from '@/lib/pdf';
import { inquiryByToken } from '@/lib/store';

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const i = inquiryByToken(params.token);
  if (!i?.offer) return new Response('Nicht gefunden', { status: 404 });
  return new Response(await offerPdf(i), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="Angebot-${i.no}.pdf"` } });
}
