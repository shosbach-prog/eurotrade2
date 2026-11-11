import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AcceptForm from './AcceptForm';
import ProofBox from './ProofBox';
import { teamLabel } from '@/lib/deco';
import { eur } from '@/lib/format';
import { inquiryByToken, offerTotals } from '@/lib/store';

export const metadata: Metadata = { title: 'Ihr Angebot', robots: { index: false, follow: false } };
const d = (x: Date) => x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function OfferPage({ params }: { params: { token: string } }) {
  const i = inquiryByToken(params.token);
  if (!i?.offer?.sentAt) notFound();
  const o = i.offer;
  const t = offerTotals(o);
  const valid = new Date(new Date(o.createdAt).getTime() + o.validDays * 86400000);
  const expired = Date.now() > valid.getTime() + 86400000;
  const accepted = ['angenommen', 'bestellt', 'geliefert'].includes(i.status ?? '');
  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="list-head">
        <div>
          <h1 style={{ marginBottom: 4 }}>Ihr Angebot {i.no}</h1>
          <p className="muted" style={{ margin: 0 }}>für {i.customer.company || i.customer.name} · gültig bis {d(valid)}</p>
        </div>
        <a className="btn alt" href={`/api/angebot/${params.token}/pdf`} target="_blank" rel="noreferrer" style={{ display: 'inline-grid', placeItems: 'center' }}>PDF herunterladen</a>
      </div>
      <div className="box" style={{ overflowX: 'auto' }}>
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
      </div>
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
      {i.proof?.sentAt && <ProofBox token={params.token} proof={i.proof} name={i.customer.name} />}
      <div className="box" style={{ marginTop: 16 }}>
        {accepted ? <p className="ok" style={{ margin: 0, fontWeight: 600 }}>✓ Sie haben dieses Angebot angenommen. Vielen Dank – wir melden uns mit der Druckfreigabe bzw. dem Liefertermin.</p>
          : expired ? <p className="err" style={{ margin: 0 }}>Dieses Angebot ist abgelaufen. Antworten Sie gern auf unsere E-Mail – wir erstellen Ihnen ein neues.</p>
          : <AcceptForm token={params.token} defaultName={i.customer.name} total={eur(t.gross)} hasPreview={i.lines.some((l) => l.deco?.previews?.length)} />}
      </div>
    </div>
  );
}
