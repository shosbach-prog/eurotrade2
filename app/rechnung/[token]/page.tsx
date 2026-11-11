import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { amountDue, dueDate, invoiceByToken, invoiceTotals, kindName } from '@/lib/invoice';
import { eur } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Ihre Rechnung', robots: { index: false, follow: false } };

export default function InvoicePage({ params }: { params: { token: string } }) {
  const i = invoiceByToken(params.token);
  if (!i) notFound();
  const t = invoiceTotals(i), s = i.seller!;
  const storno = i.kind === 'storno' || i.kind === 'gutschrift';
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="box inv-pub">
        <span className={`st st-${i.status === 'bezahlt' ? 'angenommen' : i.status === 'storniert' ? 'abgelehnt' : 'angebot'}`}>{storno ? 'Rechnungskorrektur' : i.status === 'bezahlt' ? '✓ Bezahlt' : i.status === 'storniert' ? 'Storniert' : 'Offen'}</span>
        <h1 style={{ margin: '10px 0 4px' }}>{kindName(i)} {i.no}</h1>{i.refNo && <p className="muted" style={{ margin: 0 }}>zu Rechnung {i.refNo}</p>}{i.settleNote && <p style={{ fontSize: 14 }}>{i.settleNote}</p>}
        <p className="muted" style={{ marginTop: 0 }}>vom {new Date(i.date).toLocaleDateString('de-DE')} · {i.buyer.company || i.buyer.name}</p>
        <div className="inv-amount">{eur(t.gross)}{!storno && i.status === 'offen' && amountDue(i) < t.gross && <small>noch offen: {eur(amountDue(i))}</small>}{!storno && i.status === 'offen' && <small>fällig am {dueDate(i).toLocaleDateString('de-DE')}</small>}</div>
        {!storno && i.status === 'offen' && s.iban && <dl className="sys-dl" style={{ marginTop: 14 }}>
          <dt>Empfänger</dt><dd>{s.owner || s.company}</dd><dt>IBAN</dt><dd>{s.iban}</dd>{s.bic && <><dt>BIC</dt><dd>{s.bic}</dd></>}<dt>Verwendungszweck</dt><dd><b>{i.no}</b></dd>
        </dl>}
        <div className="deco-row" style={{ marginTop: 18 }}>
          <a className="btn" href={`/api/rechnung/${params.token}`} target="_blank" rel="noreferrer" style={{ display: 'inline-grid', placeItems: 'center' }}>PDF ansehen</a>
          <a className="btn alt" href={`/api/rechnung/${params.token}?xml`} style={{ display: 'inline-grid', placeItems: 'center' }}>E-Rechnung (XRechnung) laden</a>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>Fragen zur Rechnung? <a className="alink" href={`mailto:${s.email}?subject=Rechnung ${i.no}`}>{s.email}</a> · {s.phone}</p>
      </div>
    </div>
  );
}
