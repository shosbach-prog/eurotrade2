import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import InvoiceList from './InvoiceList';
import InvoiceSettingsForm from './InvoiceSettingsForm';
import { isCredit, sign, dueDate, invoiceSettings, invoiceTotals, isOverdue, listInvoices, settingsMissing } from '@/lib/invoice';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Rechnungen', robots: { index: false, follow: false } };

export default function Rechnungen() {
  const s = invoiceSettings();
  const rows = listInvoices().map((i) => {
    const t = invoiceTotals(i);
    return { id: i.id, no: i.no, kind: i.kind, status: i.status, date: i.date, due: !isCredit(i) && i.no ? dueDate(i).toISOString() : null, customer: i.buyer.company || i.buyer.name || '–', gross: sign(i) * t.gross, net: sign(i) * t.net, refund: i.kind === 'gutschrift' && i.status === 'offen' ? i.paidAmount ?? 0 : 0, overdue: isOverdue(i), sent: !!i.sentAt, reminders: i.reminders?.length ?? 0, inquiryNo: i.inquiryNo ?? null };
  });
  const missing = settingsMissing(s);
  return (
    <>
      <AdminNav active="rechnungen" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ marginRight: 'auto', marginBottom: 4 }}>Rechnungen</h1>
      </div>
      {missing.length > 0 && <p className="sys-warn">⚠ Für gesetzeskonforme Rechnungen fehlt noch: <b>{missing.join(', ')}</b> – unten unter „Rechnungsdaten“ eintragen.</p>}
      <InvoiceList rows={rows} />
      <InvoiceSettingsForm initial={{ ...s, lexofficeKey: s.lexofficeKey ? '••••••••' : '' }} open={missing.length > 0} />
    </>
  );
}
