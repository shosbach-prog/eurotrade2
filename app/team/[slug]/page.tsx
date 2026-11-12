import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct } from '@/lib/catalog';
import { getTeamShop, isOpen } from '@/lib/teamshop';
import ProductImage from '@/components/ProductImage';
import { eur } from '@/lib/format';
import { productPath } from '@/lib/format';
import { Money } from '@/components/PriceMode';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const t = getTeamShop(params.slug);
  return { title: t ? `Team-Shop ${t.name}` : 'Team-Shop', robots: { index: false, follow: false } };
}

export default function TeamShopPage({ params }: { params: { slug: string } }) {
  const t = getTeamShop(params.slug);
  if (!t) notFound();
  const items = t.items.map((id) => getProduct(id, null)).filter((p): p is NonNullable<typeof p> => !!p);
  const open = isOpen(t);
  const days = t.deadline ? Math.ceil((Date.parse(t.deadline + 'T23:59:59') - Date.now()) / 864e5) : null;
  return (
    <div className="tshop">
      <section className="tshop-hero" style={t.color ? { ['--team' as string]: t.color } : undefined}>
        {t.logoId && <img src={`/api/upload/${t.logoId}`} alt={t.name} className="tshop-logo" />}
        <div>
          <span className="tshop-kicker">Offizieller Team-Shop</span>
          <h1>{t.name}</h1>
          <p>{t.method} mit Vereinslogo{t.personalize !== 'aus' ? ` · auf Wunsch mit ${t.personalize === 'name' ? 'Ihrem Namen' : t.personalize === 'nummer' ? 'Ihrer Nummer' : 'Name und Nummer'}` : ''} · ab 1 Stück · Lieferung gesammelt an den Verein</p>
          {t.deadline && <div className={`tshop-dl ${open ? '' : 'closed'}`}>{open ? <>Bestellschluss <b>{new Date(t.deadline).toLocaleDateString('de-DE')}</b>{days != null && days <= 14 && <> · noch {days} {days === 1 ? 'Tag' : 'Tage'}</>}</> : 'Der Bestellzeitraum ist beendet.'}</div>}
        </div>
      </section>
      {t.note && <p className="tshop-note">{t.note}</p>}
      <ol className="tshop-steps"><li><b>Artikel wählen</b> Farbe und Größe aussuchen</li><li><b>{t.personalize !== 'aus' ? 'Name / Nummer eintragen' : 'Menge festlegen'}</b> das Vereinslogo ist schon gesetzt</li><li><b>Anfrage senden</b> Sie erhalten Ihr Angebot per E-Mail</li></ol>
      <div className="grid">
        {items.map((p) => (
          <Link key={p.id} href={`${productPath(p)}?team=${t.slug}`} className="card">
            <div className="img"><ProductImage p={p} /></div>
            <div className="body">
              <div className="name">{p.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>{p.colors.length} Farben · {p.sizes.length ? `${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}` : ''}</div>
              <div className="price">{p.price != null ? <Money net={p.price} label /> : <small style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>Preis auf Anfrage</small>}</div>
            </div>
          </Link>
        ))}
      </div>
      {!items.length && <p className="muted">Hier erscheinen bald die Artikel Ihres Vereins.</p>}
      <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>Fragen zum Team-Shop? Produktberatung: <a className="alink" href="tel:+493040719258">030 40719258</a> · <a className="alink" href="mailto:info@euro-trade.com">info@euro-trade.com</a>{t.contact ? <> · Ansprechpartner im Verein: {t.contact}</> : null}</p>
    </div>
  );
}
