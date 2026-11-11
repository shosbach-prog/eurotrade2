import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import OfferEditor from './OfferEditor';
import ProofSender from './ProofSender';
import CreateInvoice from './CreateInvoice';
import ShippingBox from './ShippingBox';
import MarginBox from './MarginBox';
import QuickOffer from './QuickOffer';
import { dhlLabelEnabled, trackingUrl } from '@/lib/shipping';
import { inquiryMargin } from '@/lib/margin';
import { INV_STATUS, invoiceTotals, kindShort, listInvoices } from '@/lib/invoice';
import { getTeamShop } from '@/lib/teamshop';
import { eur } from '@/lib/format';
import { adminProduct } from '@/lib/catalog';
import { decoLabel, teamLabel } from '@/lib/deco';
import { mailEnabled, shopUrl } from '@/lib/mail';
import { STATUS, draftOffer, getInquiry, offerTotals } from '@/lib/store';

export const metadata: Metadata = { title: 'Anfrage', robots: { index: false, follow: false } };
const fmt = (d: string) => new Date(d).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

export default function InquiryPage({ params }: { params: { no: string } }) {
  const i = getInquiry(params.no);
  if (!i) notFound();
  const c = i.customer;
  const logos = [...new Map(i.lines.filter((l) => l.deco?.logoId).map((l) => [l.deco!.logoId!, l.deco!.logoName ?? 'Logo'])).entries()];
  // Einkaufskonditionen (nur Admin): Staffel-EK nach Gesamtmenge je Artikel, sonst EK zum Anfragezeitpunkt / aktueller EK
  const qtyBy = i.lines.reduce<Record<string, number>>((m, l) => ({ ...m, [l.id ?? l.sku]: (m[l.id ?? l.sku] ?? 0) + l.qty }), {});
  const ek = i.lines.map((l) => {
    const p = l.id ? adminProduct(l.id).p : null, total = qtyBy[l.id ?? l.sku];
    const t = [...(p?.baseTiers ?? [])].filter((x) => x.price > 0).sort((a, b) => a.min - b.min).reverse().find((x) => total >= x.min);
    return { unit: t?.price ?? l.ek ?? p?.basePrice ?? null, tier: t?.min ?? null, total };
  });
  const ekSum = ek.reduce((x, e, k) => x + (e.unit ?? 0) * i.lines[k].qty, 0);
  return (
    <>
      <AdminNav active="anfragen" />
      <div className="crumbs"><Link href="/admin">Anfragen</Link> › {i.no}</div>
      <div className="list-head">
        <h1 style={{ marginBottom: 0 }}>Anfrage {i.no}</h1>
        <span className={`st st-${i.status}`}>{STATUS[i.status!]}</span>
      </div>
      {!i.offer?.sentAt && (() => {
        const o = i.offer ?? draftOffer(i);
        const t = offerTotals(o);
        const w: string[] = [];
        const zero = o.lines.filter((l) => l.price === 0);
        if (zero.length) w.push(`${zero.length} Position(en) ohne Preis: ${zero.map((l) => l.text).slice(0, 3).join(', ')}`);
        if (i.lines.some((l) => l.deco?.method === 'Beratung gewünscht')) w.push('Kunde wünscht Beratung zur Veredelung');
        if (i.lines.some((l) => l.deco?.note)) w.push('Kunde hat Hinweise zur Veredelung notiert');
        if (i.customer.message) w.push('Kunde hat eine Nachricht geschrieben – bitte lesen');
        if (!o.shipping) w.push('Versand 0 € – Pauschale unter Admin → Veredelung einstellen');
        const m = inquiryMargin({ ...i, offer: o });
        return <QuickOffer no={i.no} offer={o} gross={t.gross} net={t.net} margin={m} warnings={w} mail={mailEnabled()} email={i.customer.email} />;
      })()}
      <div className="admin-grid">
        <div className="box">
          <strong>Kunde</strong>
          <p style={{ margin: '6px 0 0' }}>{c.company && <><b>{c.company}</b><br /></>}{c.name}<br /><a href={`mailto:${c.email}`} className="alink">{c.email}</a>{c.phone && <> · {c.phone}</>}{c.city && <><br />{c.city}</>}</p>
          {c.date && <p style={{ margin: '8px 0 0' }}><b>Wunschliefertermin:</b> {new Date(c.date).toLocaleDateString('de-DE')}</p>}
          {i.zugangscode && <p className="muted" style={{ margin: '8px 0 0' }}>Zugangscode: {i.zugangscode}</p>}
          {i.team && <p style={{ margin: '8px 0 0' }}><span className="st st-angebot">Team-Shop: {getTeamShop(i.team)?.name ?? i.team}</span> <Link className="alink" href="/admin/teamshops" style={{ fontSize: 13 }}>Sammelbestellung</Link></p>}
          {i.lines.some((l) => l.sample) && <p style={{ margin: '8px 0 0' }}><span className="st st-neu">Musterbestellung</span> <span className="muted" style={{ fontSize: 13 }}>– bei Folgeauftrag anrechnen</span></p>}
          {i.previewApprovedAt && <p className="ok" style={{ margin: '8px 0 0', fontSize: 14 }}>✓ Motiv-Vorschau mit der Annahme freigegeben</p>}
          {i.discount && <p style={{ margin: '8px 0 0' }}><span className="st st-angenommen">Rabattcode {i.discount.code} · {i.discount.pct} %</span> <span className="muted" style={{ fontSize: 13 }}>– im Angebot als Position enthalten</span></p>}
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
          <thead><tr><th>Art.-Nr.</th><th>Artikel</th><th>Farbe</th><th>Größe</th><th>Menge</th><th className="ek" title="nur im Admin sichtbar">EK / Stk.</th><th>Shoppreis</th><th>Summe</th><th className="ek">EK Summe</th><th className="ek">Aufschlag</th></tr></thead>
          <tbody>{i.lines.map((l, k) => (
            <tr key={k}>
              <td>{l.sku}</td>
              <td>{l.sample && <span className="sample-tag">Muster</span>}{l.id ? <Link href={`/produkt/${l.id}`} className="alink" target="_blank">{l.name}</Link> : l.name}{l.deco && <div className="deco-tag">✦ {decoLabel(l.deco)}{l.deco.note && <> – <i>{l.deco.note}</i></>}</div>}
                {l.deco?.team?.rows.length ? <div className="muted" style={{ fontSize: 12.5 }}>{l.deco.team.pos}: {teamLabel(l.deco.team.rows)}</div> : null}
                {l.deco?.previews?.length ? <div className="cl-prev">{l.deco.previews.map((id) => <a key={id} href={`/api/upload/${id}`} target="_blank"><img src={`/api/upload/${id}`} alt="Vorschau" /></a>)}</div> : null}</td>
              <td>{l.color}</td><td>{l.size}</td><td>{l.qty}</td>
              {(() => { const e = ek[k]; return <><td className="ek" title={e.tier ? `Staffel-EK ab ${e.tier} Stk. (Gesamtmenge ${e.total})` : 'EK netto'}>{e.unit == null ? <span className="err">fehlt</span> : <>{eur(e.unit)}{e.tier ? <small> ab {e.tier}</small> : null}</>}</td>
              <td>{eur(l.price)}</td><td>{l.price == null ? '–' : eur(l.sum)}</td>
              <td className="ek">{e.unit == null ? '–' : eur(e.unit * l.qty)}</td>
              <td className="ek">{e.unit && l.price != null ? `${Math.round((l.price / e.unit - 1) * 100)} %` : '–'}</td></>; })()}
            </tr>))}
          </tbody>
          <tfoot><tr><td colSpan={4}><b>Summe</b></td><td><b>{i.lines.reduce((x, l) => x + l.qty, 0)}</b></td><td className="ek" /><td /><td><b>{eur(i.lines.reduce((x, l) => x + (l.price == null ? 0 : l.sum), 0))}</b></td>
            <td className="ek"><b>{eur(ekSum)}</b>{ek.some((e) => e.unit == null) && <small className="err"> unvollständig</small>}</td>
            <td className="ek">{(() => { const vk = i.lines.reduce((x, l) => x + (l.price == null ? 0 : l.sum), 0); return vk && ekSum ? <b title="Rohertrag Textil (ohne Veredelung und Versand)">{eur(vk - ekSum)}</b> : '–'; })()}</td></tr></tfoot>
        </table>
      </div>

      {i.lines.some((l) => l.deco) && <><h2>Freigabe</h2><ProofSender no={i.no} proof={i.proof ?? null} previews={[...new Map(i.lines.flatMap((l) => (l.deco?.previews ?? []).map((id, k) => [id, `${l.color || l.name}${k ? ' hinten' : ''}`] as const))).entries()].map(([id, label]) => ({ id, label }))} /></>}
      {['angenommen', 'bestellt', 'geliefert'].includes(i.status!) && <><h2>Versand</h2><ShippingBox no={i.no} shipment={i.shipment ?? null} trackingUrl={trackingUrl(i.shipment)} dhl={dhlLabelEnabled()} addr={(() => { const m = /^\s*(\d{4,5})\s+(.+)$/.exec(c.city ?? ''); return { name1: c.company || c.name, name2: c.company ? c.name : '', street: c.street ?? '', zip: m?.[1] ?? '', city: m?.[2] ?? c.city ?? '' }; })()} /></>}
      {i.offer && <MarginBox m={inquiryMargin(i)} />}
      {(() => {
        const invs = listInvoices().filter((x) => x.inquiryNo === i.no);
        if (!i.offer && !invs.length) return null;
        return <><h2>Rechnung</h2><div className="box">
          {invs.map((x) => <p key={x.id} style={{ margin: '0 0 8px' }}><Link className="alink" href={`/admin/rechnungen/${x.id}`}><b>{x.no ?? 'Entwurf'}</b></Link>{x.kind === 'rechnung' && !x.prepaid?.length ? '' : ` (${kindShort(x)})`} · {eur(invoiceTotals(x).gross)} · <span className={`st st-${x.status === 'bezahlt' ? 'angenommen' : x.status === 'offen' ? 'angebot' : x.status === 'storniert' ? 'abgelehnt' : 'neu'}`}>{INV_STATUS[x.status]}</span></p>)}
          {!invs.some((x) => x.kind === 'rechnung' && x.status !== 'storniert') && <div className="deco-row">
            <CreateInvoice no={i.no} label={invs.some((x) => x.kind === 'abschlag' && x.no && x.status !== 'storniert') ? 'Schlussrechnung erstellen (Abschläge werden abgezogen)' : 'Rechnung aus Angebot erstellen'} />
            <CreateInvoice no={i.no} pct={50} className="btn alt sm" label="Abschlag 50 %" />
            <CreateInvoice no={i.no} pct={30} className="btn alt sm" label="Abschlag 30 %" />
            <span className="muted" style={{ fontSize: 13 }}>übernimmt Positionen, Preise und Kundendaten – vor dem Festschreiben noch änderbar</span>
          </div>}
        </div></>;
      })()}
      <h2 id="angebot">Angebot</h2>
      <OfferEditor no={i.no} initial={i.offer ?? draftOffer(i)} saved={!!i.offer} status={i.status!} statuses={STATUS} mail={mailEnabled()} acceptUrl={i.token ? `${shopUrl()}/angebot/${i.token}` : ''} sentAt={i.offer?.sentAt ?? null} />
    </>
  );
}
