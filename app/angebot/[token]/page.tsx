import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AcceptForm from './AcceptForm';
import ProofBox from './ProofBox';
import { teamLabel } from '@/lib/deco';
import { invoiceTotals, listInvoices } from '@/lib/invoice';
import { eur } from '@/lib/format';
import { inquiryByToken, offerTotals } from '@/lib/store';
import { CARRIERS, trackingUrl } from '@/lib/shipping';
import ReorderButton from '@/components/ReorderButton';
import OrderTimeline from './OrderTimeline';

export const metadata: Metadata = { title: 'Ihr Auftrag', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
const d = (x: Date) => x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function OfferPage({ params }: { params: { token: string } }) {
  const i = inquiryByToken(params.token);
  if (!i) notFound();
  const o = i.offer?.sentAt ? i.offer : null;
  const t = o ? offerTotals(o) : null;
  const valid = o ? new Date(new Date(o.createdAt).getTime() + o.validDays * 86400000) : new Date();
  const expired = !!o && Date.now() > valid.getTime() + 86400000;
  const accepted = ['angenommen', 'bestellt', 'geliefert'].includes(i.status ?? '');
  const invs = listInvoices().filter((x) => x.inquiryNo === i.no && x.no);
  const s = i.shipment;
  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="list-head">
        <div>
          <h1 style={{ marginBottom: 4 }}>{accepted ? 'Ihr Auftrag' : o ? 'Ihr Angebot' : 'Ihre Anfrage'} {i.no}</h1>
          <p className="muted" style={{ margin: 0 }}>für {i.customer.company || i.customer.name}{o && !accepted ? ` · gültig bis ${d(valid)}` : ''}</p>
        </div>
        <div className="deco-row">
          <ReorderButton no={i.no} lines={i.lines.map((l) => ({ id: l.id, color: l.color, size: l.size, qty: l.qty, deco: l.deco ?? null, sample: l.sample }))} />
          {o && <a className="btn alt" href={`/api/angebot/${params.token}/pdf`} target="_blank" rel="noreferrer" style={{ display: 'inline-grid', placeItems: 'center' }}>Angebot als PDF</a>}
        </div>
      </div>
      <OrderTimeline steps={[
        { label: 'Anfrage', date: i.date, done: true },
        { label: 'Angebot', date: i.offer?.sentAt ?? null, done: !!o, hint: o ? undefined : 'in Arbeit – meist innerhalb von 24 Stunden' },
        { label: 'Auftrag', date: i.acceptedAt ?? null, done: accepted },
        ...(i.lines.some((l) => l.deco) ? [{ label: 'Freigabe', date: i.proof?.approvedAt ?? i.previewApprovedAt ?? null, done: !!(i.proof?.approvedAt || (i.previewApprovedAt && !i.proof?.sentAt)), hint: i.proof?.sentAt && !i.proof.approvedAt ? 'bitte unten freigeben' : undefined }] : []),
        { label: 'Produktion', date: null, done: i.status === 'bestellt' || i.status === 'geliefert' || !!s },
        { label: s?.carrier === 'abholung' ? 'Abholbereit' : 'Versand', date: s?.shippedAt ?? null, done: !!s, hint: s?.tracking ? `${CARRIERS[s.carrier]?.name ?? ''} ${s.tracking}` : undefined, href: trackingUrl(s) || undefined },
        { label: 'Zugestellt', date: s?.deliveredAt ?? (i.status === 'geliefert' ? i.deliveredAt ?? null : null), done: i.status === 'geliefert' },
        { label: 'Rechnung', date: invs.find((x) => x.kind === 'rechnung')?.date ?? null, done: invs.some((x) => x.kind === 'rechnung' && x.status === 'bezahlt'), hint: invs.some((x) => x.kind === 'rechnung' && x.status === 'offen') ? 'offen' : undefined },
      ]} />
      {o && t && <div className="box" style={{ overflowX: 'auto' }}>
        <table className="atable">
          <thead><tr><th>Pos.</th><th>Artikel / Leistung</th><th>Menge</th><th>Einzelpreis</th><th>Gesamt</th></tr></thead>
          <tbody>{o.lines.map((l, k) => (
            <tr key={k}><td>{k + 1}</td><td><strong>{l.text}</strong>{l.detail && <div className="muted" style={{ fontSize: 13 }}>{l.detail}</div>}</td><td>{l.qty}</td><td>{eur(l.price)}</td><td>{eur(l.qty * l.price)}</td></tr>
          ))}</tbody>
        </table>
        <div className="offer-sum" style={{ marginLeft: 'auto', marginTop: 12 }}>
          {o.shipping > 0 && <div className="tot"><span>Versand</span><span>{eur(o.shipping)}</span></div>}
          <div className="tot"><span>Summe netto</span><span>{eur(t.net)}</span></div>
          <div className="tot"><span>MwSt. {o.vat} %</span><span>{eur(t.vat)}</span></div>
          <div className="tot big"><span>Gesamt</span><span>{eur(t.gross)}</span></div>
        </div>
        {o.note && <p style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>{o.note}</p>}
      </div>}
      {!o && <div className="box"><p style={{ margin: 0 }}>Wir erstellen gerade Ihr Angebot. Sie erhalten es per E-Mail an <b>{i.customer.email}</b> – und sehen es dann auch hier.</p>
        <ul className="my-lines" style={{ marginTop: 10 }}>{i.lines.map((l, k) => <li key={k}>{l.qty}× {l.name}{l.color && ` · ${l.color}`}{l.size && ` · ${l.size}`}{l.deco ? ' ✦' : ''}</li>)}</ul></div>}
      {(() => {
        const prev = [...new Map(i.lines.flatMap((l) => (l.deco?.previews ?? []).map((id) => [id, `${l.name}${l.color ? ` · ${l.color}` : ''}`] as const))).entries()];
        const teams = i.lines.filter((l) => l.deco?.team?.rows.length);
        if (!prev.length && !teams.length) return null;
        return <div className="box" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Ihre Motiv-Vorschau</h2>
          <p className="muted" style={{ marginTop: -4 }}>So haben Sie Position und Größe im Shop gewählt.{i.previewApprovedAt ? ' ✓ Mit der Annahme freigegeben.' : ' Mit der Annahme geben Sie diese Vorschau frei – kleine technische Anpassungen (z. B. Farbtöne, Stickdichte) stimmen wir vorher mit Ihnen ab.'}</p>
          {prev.length > 0 && <div className="of-prev">{prev.map(([id, label]) => <a key={id} href={`/api/angebot/${params.token}/bild/${id}`} target="_blank" rel="noreferrer"><img src={`/api/angebot/${params.token}/bild/${id}`} alt={`Vorschau ${label}`} /><span>{label}</span></a>)}</div>}
          {teams.map((l, k) => <p key={k} style={{ fontSize: 14 }}><b>{l.name} {l.color} {l.size}</b> – {l.deco!.team!.pos}: {teamLabel(l.deco!.team!.rows)}</p>)}
        </div>;
      })()}
      {invs.map((x) => <div key={x.id} className="box" style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}><b>{x.kind === 'storno' ? 'Rechnungskorrektur' : 'Rechnung'} {x.no}</b><div className="muted" style={{ fontSize: 14 }}>{eur(invoiceTotals(x).gross)} · {x.status === 'bezahlt' ? '✓ bezahlt' : x.status === 'storniert' ? 'storniert' : 'offen'}</div></div>
        <a className="btn alt" href={`/rechnung/${x.token}`} style={{ display: 'inline-grid', placeItems: 'center' }}>Rechnung ansehen</a>
      </div>)}
      {i.proof?.sentAt && <ProofBox token={params.token} proof={i.proof} name={i.customer.name} />}
      {o && t && <div className="box" style={{ marginTop: 16 }}>
        {accepted ? <p className="ok" style={{ margin: 0, fontWeight: 600 }}>✓ Sie haben dieses Angebot angenommen. Vielen Dank – den Fortschritt sehen Sie oben.</p>
          : expired ? <p className="err" style={{ margin: 0 }}>Dieses Angebot ist abgelaufen. Antworten Sie gern auf unsere E-Mail – wir erstellen Ihnen ein neues.</p>
          : <AcceptForm token={params.token} defaultName={i.customer.name} total={eur(t.gross)} hasPreview={i.lines.some((l) => l.deco?.previews?.length)} addr={{ company: i.customer.company ?? '', street: i.customer.street ?? '', city: i.customer.city ?? '' }} />}
      </div>}
    </div>
  );
}
