import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import InvoiceEditor from './InvoiceEditor';
import { creditable, getInvoice, invoiceSettings, invoiceTotals, isOverdue, dueDate, listInvoices } from '@/lib/invoice';
import { invoiceProblems } from '@/lib/invoice-actions';
import { mailEnabled, shopUrl } from '@/lib/mail';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Rechnung', robots: { index: false, follow: false } };

export default function InvoicePage({ params }: { params: { id: string } }) {
  const i = getInvoice(params.id);
  if (!i) notFound();
  return (
    <>
      <AdminNav active="rechnungen" />
      <div className="crumbs"><Link href="/admin/rechnungen">Rechnungen</Link> › {i.no ?? 'Entwurf'}{i.inquiryNo && <> · aus <Link className="alink" href={`/admin/anfrage/${i.inquiryNo}`}>{i.inquiryNo}</Link></>}</div>
      <InvoiceEditor initial={i} problems={i.no ? [] : invoiceProblems(i)} overdue={isOverdue(i)} due={dueDate(i).toISOString()} total={invoiceTotals(i).gross} mail={mailEnabled()} publicUrl={`${shopUrl()}/rechnung/${i.token}`} acct={{ mail: !!invoiceSettings().bookkeepingEmail, lex: !!invoiceSettings().lexofficeKey }} maxCredit={i.kind === 'gutschrift' ? (() => { const o = listInvoices().find((x) => x.no === i.refNo); return o ? creditable(o) : 0; })() : i.no ? creditable(i) : 0} refId={i.refNo ? listInvoices().find((x) => x.no === i.refNo)?.id ?? null : null} creditIds={(i.credits ?? []).map((c) => ({ no: c.no, id: listInvoices().find((x) => x.no === c.no)?.id ?? '' }))} />
    </>
  );
}
