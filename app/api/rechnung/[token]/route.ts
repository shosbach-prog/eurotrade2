import { invoiceByToken } from '@/lib/invoice';
import { archivedPdf, archivedXml } from '@/lib/invoice-actions';

/** Kunde lädt seine Rechnung über den geheimen Link (PDF oder ?xml) */
export function GET(req: Request, { params }: { params: { token: string } }) {
  const i = invoiceByToken(params.token);
  if (!i) return new Response('Nicht gefunden', { status: 404 });
  const xml = new URL(req.url).searchParams.has('xml');
  const f = xml ? archivedXml(i) : archivedPdf(i);
  if (!f) return new Response('Nicht gefunden', { status: 404 });
  return new Response(f, { headers: { 'Content-Type': xml ? 'application/xml; charset=utf-8' : 'application/pdf', 'Content-Disposition': `${xml ? 'attachment' : 'inline'}; filename="${i.no}${xml ? '-xrechnung.xml' : '.pdf'}"`, 'Cache-Control': 'private, no-store' } });
}
