import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import OfferEditor from './OfferEditor';
import { eur } from '@/lib/format';
import { decoLabel } from '@/lib/deco';
import { mailEnabled, shopUrl } from '@/lib/mail';
import { STATUS, draftOffer, getInquiry } from '@/lib/store';

export const metadata: Metadata = { title: 'Anfrage', robots: { index: false, follow: false } };
const fmt = (d: string) => new Date(d).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

export default function InquiryPage({ params }: { params: { no: string } }) {
  const i = getInquiry(params.no);
  if (!i) notFound();
  const c = i.customer;
  const logos = [...new Map(i.lines.filter((l) => l.deco?.logoId).map((l) => [l.deco!.logoId!, l.deco!.logoName ?? 'Logo'])).entries()];
  return (
    <>
      <AdminNav active="anfragen" />
      <div className="crumbs"><Link href="/admin">Anfragen</Link> › {i.no}</div>
      <div className="list-head">
        <h1 style={{ marginBottom: 0 }}>Anfrage {i.no}</h1>
        <span className={`st st-${i.status}`}>{STATUS[i.status!]}</span>
      </div>
      <div className="admin-grid">
        <div className="box">
          <strong>Kunde</strong>
          <p style={{ margin: '6px 0 0' }}>{c.company && <><b>{c.company}</b><br /></>}{c.name}<br /><a href={`mailto:${c.email}`} className="alink">{c.email}</a>{c.phone && <> · {c.phone}</>}{c.city && <><br />{c.city}</>}</p>
          {i.zugangscode && <p className="muted" style={{ margin: '8px 0 0' }}>Zugangscode: {i.zugangscode}</p>}
          {c.message && <p style={{ whiteSpace: 'pre-wrap', margin: '10px 0 0', background: '#f6f7f9', padding: 10, borderRadius: 8 }}>{c.message}</p>}
          <p className="muted" style={{ fontSize: 13, margin: '10px 0 0' }}>Eingegangen: {fmt(i.date)}</p>
        </div>
        <div className="box">
          <strong>Verlauf</strong>
          <ul className="hist">{(i.history ?? []).slice().reverse().map((h, k) => <li key={k}><span className="muted">{fmt(h.date)}</span> {h.text}</li>)}</ul>
          {logos.length > 0 && <>
            <strong>Logos</strong>
            <div className="logo-list">{logos.map(([id, n]) => <a key={id} href={`/api/upload/${id}?download`} className="logo-file"><img src={`/api/upload/${id}`} alt="" onError={undefined} /><span>{n}</span></a>)}</div>
          </>}
        </div>
      </div>

      <h2>Angefragte Positionen</h2>
      <div className="box" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="atable">
          <thead><tr><th>Art.-Nr.</th><th>Artikel</th><th>Farbe</th><th>Größe</th><th>Menge</th><th>Shoppreis</th><th>Summe</th></tr></thead>
          <tbody>{i.lines.map((l, k) => (
            <tr key={k}>
              <td>{l.sku}</td>
              <td>{l.id ? <Link href={`/produkt/${l.id}`} className="alink" target="_blank">{l.name}</Link> : l.name}{l.deco && <div className="deco-tag">✦ {decoLabel(l.deco)}{l.deco.note && <> – <i>{l.deco.note}</i></>}</div>}</td>
              <td>{l.color}</td><td>{l.size}</td><td>{l.qty}</td><td>{eur(l.price)}</td><td>{l.price == null ? '–' : eur(l.sum)}</td>
            </tr>))}
          </tbody>
        </table>
      </div>

      <h2>Angebot</h2>
      <OfferEditor no={i.no} initial={i.offer ?? draftOffer(i)} saved={!!i.offer} status={i.status!} statuses={STATUS} mail={mailEnabled()} acceptUrl={i.token ? `${shopUrl()}/angebot/${i.token}` : ''} sentAt={i.offer?.sentAt ?? null} />
    </>
  );
}
