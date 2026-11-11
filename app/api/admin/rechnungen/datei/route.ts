import { isAdmin } from '@/lib/customer';
import { getInvoice, invoiceSettings, listInvoices, invoiceTotals, INV_STATUS, dueDate } from '@/lib/invoice';
import { archivedPdf, archivedXml } from '@/lib/invoice-actions';
import { invoicePdf } from '@/lib/invoice-pdf';
import { toCsv } from '@/lib/csv';
import { zip } from '@/lib/zip';

/** PDF / XML einer Rechnung (Entwurf = Vorschau mit Wasserzeichen) oder CSV-Export für den Steuerberater */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response('Nicht angemeldet', { status: 401 });
  const u = new URL(req.url), type = u.searchParams.get('typ');
  if (type === 'zip') {
    // Belegpaket für den Steuerberater: alle PDFs + XRechnungen + Liste eines Monats/Jahres
    const per = u.searchParams.get('zeitraum') ?? new Date().toISOString().slice(0, 7);
    const rows = listInvoices().filter((i) => i.no && i.date.startsWith(per)).sort((a, b) => (a.no! < b.no! ? -1 : 1));
    const files: { name: string; data: Buffer }[] = [];
    for (const i of rows) { const p = archivedPdf(i), x = archivedXml(i); if (p) files.push({ name: `${i.no}.pdf`, data: p }); if (x) files.push({ name: `xrechnung/${i.no}.xml`, data: x }); }
    files.push({ name: `rechnungen-${per}.csv`, data: Buffer.from(toCsv([['Rechnungs-Nr.', 'Art', 'Datum', 'Kunde', 'Netto', 'USt', 'Brutto', 'Bezahlt am'], ...rows.map((i) => { const t = invoiceTotals(i), sg = i.kind === 'storno' || i.kind === 'gutschrift' ? -1 : 1; return [i.no, i.kind, i.date, i.buyer.company || i.buyer.name, (sg * t.net).toFixed(2).replace('.', ','), (sg * t.vat).toFixed(2).replace('.', ','), (sg * t.gross).toFixed(2).replace('.', ','), i.paidAt ?? '']; })]), 'utf8') });
    return new Response(zip(files), { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="belege-${per}.zip"` } });
  }
  if (type === 'csv') {
    const year = u.searchParams.get('jahr');
    const rows = listInvoices().filter((i) => i.no && (!year || i.date.startsWith(year))).sort((a, b) => (a.no! < b.no! ? -1 : 1));
    const csv = toCsv([['Rechnungs-Nr.', 'Art', 'Datum', 'Leistungsdatum', 'Kunde', 'Netto', 'USt-Satz', 'USt', 'Brutto', 'Status', 'Fällig', 'Bezahlt am', 'Bezug'],
      ...rows.map((i) => { const t = invoiceTotals(i), sg = i.kind === 'storno' || i.kind === 'gutschrift' ? -1 : 1; return [i.no, i.kind === 'storno' ? 'Storno' : i.kind === 'gutschrift' ? 'Gutschrift' : i.kind === 'abschlag' ? 'Abschlag' : i.prepaid?.length ? 'Schlussrechnung' : 'Rechnung', i.date, i.serviceDate, i.buyer.company || i.buyer.name, (sg * t.net).toFixed(2).replace('.', ','), String(t.rate), (sg * t.vat).toFixed(2).replace('.', ','), (sg * t.gross).toFixed(2).replace('.', ','), i.kind === 'storno' || i.kind === 'gutschrift' ? 'Korrektur' : INV_STATUS[i.status], i.kind === 'storno' || i.kind === 'gutschrift' ? '' : dueDate(i).toISOString().slice(0, 10), i.paidAt ?? '', i.refNo ?? i.stornoNo ?? '']; })]);
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="rechnungen-${year ?? 'alle'}.csv"` } });
  }
  const i = getInvoice(u.searchParams.get('id') ?? '');
  if (!i) return new Response('Nicht gefunden', { status: 404 });
  if (type === 'xml') { const x = archivedXml(i); return x ? new Response(x, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Content-Disposition': `attachment; filename="${i.no}-xrechnung.xml"` } }) : new Response('Erst nach dem Festschreiben', { status: 404 }); }
  const pdf = archivedPdf(i) ?? (await invoicePdf(i, invoiceSettings()));
  return new Response(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${i.no ?? 'Rechnung-Entwurf'}.pdf"` } });
}
