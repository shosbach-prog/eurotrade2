import crypto from 'node:crypto';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct } from '@/lib/catalog';
import { getTeamShop, isDirectShop, isOpen, logoChoices, rankedMotifs, teamFixedPrice } from '@/lib/teamshop';
import ProductImage from '@/components/ProductImage';
import { eur } from '@/lib/format';
import { productPath } from '@/lib/format';
import { Money } from '@/components/PriceMode';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const t = getTeamShop(params.slug);
  if (!t) return { title: 'Team-Shop', robots: { index: false, follow: false } };
  const n = t.motifs?.length ?? 0;
  const title = n ? `${t.name} – Shirts mit ${n} Motiven` : `Team-Shop ${t.name}`;
  const description = n ? `${n} Motive zur Auswahl: Motiv wählen, Shirt wählen – gedruckt ab 1 Stück. Offizieller Shop von ${t.name} auf euro-trade.com.` : `Offizieller Team-Shop ${t.name}: Artikel mit Logo ${t.method === 'Stick' ? 'bestickt' : 'bedruckt'}, ab 1 Stück – bestellen auf euro-trade.com.`;
  // Versionsnummer im Bild-Link, damit WhatsApp & Co. nach Änderungen das neue Bild laden
  const v = crypto.createHash('sha1').update(JSON.stringify(['v3', t.name, t.price, rankedMotifs(t).slice(0, 6).map((m) => m.id), t.items.slice(0, 6), t.logoId])).digest('hex').slice(0, 10);
  const image = { url: `/team/${t.slug}/og.jpg?v=${v}`, width: 1200, height: 630, alt: title, type: 'image/jpeg' };
  return { title, description, robots: { index: false, follow: false }, alternates: { canonical: `/team/${t.slug}` }, openGraph: { type: 'website', title, description, url: `/team/${t.slug}`, images: [image] }, twitter: { card: 'summary_large_image', title, description, images: [image.url] } };
}

export default function TeamShopPage({ params, searchParams }: { params: { slug: string }; searchParams?: { motiv?: string } }) {
  const t = getTeamShop(params.slug);
  if (!t) notFound();
  const items = t.items.map((id) => getProduct(id, null)).filter((p): p is NonNullable<typeof p> => !!p);
  const open = isOpen(t);
  const motifs = rankedMotifs(t);
  if (motifs.length) {
    const sel = motifs.find((m) => m.id === searchParams?.motiv) ?? null;
    const step2 = sel ? `&motiv=${sel.id}` : '';
    return (
      <div className="tshop mshop">
        <section className="tshop-hero" style={t.color ? { ['--team' as string]: t.color } : undefined}>
          {t.logoId && <img src={`/api/upload/${t.logoId}?w=320`} alt={t.name} className="tshop-logo" />}
          <div>
            <span className="tshop-kicker">Offizieller Shop</span>
            <h1>{t.name}</h1>
            <p>{motifs.length} Motive · {t.method === 'Stick' ? 'gestickt' : 'gedruckt'} auf Shirt Ihrer Wahl · ab 1 Stück{t.price ? ' · Druck im Preis enthalten' : ''}{isDirectShop(t) ? ` · Versand direkt zu Ihnen${t.shipGross ? ` (${t.shipGross.toFixed(2).replace('.', ',')} €${t.freeFromGross ? `, frei ab ${t.freeFromGross.toFixed(0)} €` : ''})` : ''}` : ''}</p>
            {t.deadline && <div className={`tshop-dl ${isOpen(t) ? '' : 'closed'}`}>{isOpen(t) ? <>Bestellschluss <b>{new Date(t.deadline).toLocaleDateString('de-DE')}</b></> : 'Der Bestellzeitraum ist beendet.'}</div>}
          </div>
        </section>
        {t.note && <p className="tshop-note">{t.note}</p>}
        <ol className="tshop-steps"><li><b>Motiv wählen</b> aus {motifs.length} Designs</li><li><b>Shirt wählen</b> Modell, Farbe und Größe</li>{isDirectShop(t) ? <li><b>Bestellen &amp; bezahlen</b> wir drucken und schicken es Ihnen</li> : <li><b>Anfrage senden</b> Sie erhalten Ihr Angebot per E-Mail</li>}</ol>
        <h2 id="motive">1. Motiv wählen</h2>
        <div className="motif-grid">
          {motifs.map((m) => (
            <Link key={m.id} href={`/team/${t.slug}?motiv=${m.id}#shirts`} scroll={false} className={`motif ${sel?.id === m.id ? 'on' : ''}`} aria-current={sel?.id === m.id ? 'true' : undefined}>
              <img src={`/api/upload/${m.id}?w=320`} alt="" loading="lazy" />
              {m.badge && <i className={`motif-badge ${m.badge === 'Neu' ? 'new' : ''}`}>{m.badge}</i>}
              <span>{m.name}</span>
            </Link>
          ))}
        </div>
        <h2 id="shirts">2. Shirt wählen{sel ? <span className="muted" style={{ fontSize: 15, fontWeight: 500 }}> · Motiv „{sel.name}“</span> : null}</h2>
        {!sel && <p className="muted" style={{ marginTop: -6 }}>Bitte zuerst oben ein Motiv auswählen – Sie können es auf der Artikelseite noch wechseln.</p>}
        <div className="grid">
          {items.map((p) => {
            const fp = teamFixedPrice(t, p.id) ?? p.price;
            return (
              <Link key={p.id} href={`${productPath(p)}?team=${t.slug}${step2 || `&motiv=${motifs[0].id}`}`} className={`card ${sel ? '' : 'dim'}`}>
                <div className="img"><ProductImage p={p} />{sel && <img className="motif-on" src={`/api/upload/${sel.id}?w=320`} alt="" aria-hidden loading="lazy" />}</div>
                <div className="body">
                  <div className="name">{p.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{p.colors.length} Farben · {p.sizes.length ? `${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}` : ''}</div>
                  <div className="price">{fp != null ? <><Money net={fp} label />{t.price ? <small> inkl. Druck</small> : null}</> : <small style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>Preis auf Anfrage</small>}</div>
                </div>
              </Link>
            );
          })}
        </div>
        {!items.length && <p className="muted">Hier erscheinen bald die Shirts.</p>}
        <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>Fragen? Produktberatung: <a className="alink" href="tel:+493040719258">030 40719258</a> · <a className="alink" href="mailto:info@euro-trade.com">info@euro-trade.com</a></p>
      </div>
    );
  }
  const days = t.deadline ? Math.ceil((Date.parse(t.deadline + 'T23:59:59') - Date.now()) / 864e5) : null;
  return (
    <div className="tshop">
      <section className="tshop-hero" style={t.color ? { ['--team' as string]: t.color } : undefined}>
        {t.logoId && <img src={`/api/upload/${t.logoId}?w=320`} alt={t.name} className="tshop-logo" />}
        <div>
          <span className="tshop-kicker">Offizieller Team-Shop</span>
          <h1>{t.name}</h1>
          <p>{t.method} mit Vereinslogo{t.personalize !== 'aus' ? ` · auf Wunsch mit ${t.personalize === 'name' ? 'Ihrem Namen' : t.personalize === 'nummer' ? 'Ihrer Nummer' : 'Name und Nummer'}` : ''} · ab 1 Stück · {isDirectShop(t) ? 'Versand direkt zu Ihnen' : 'Lieferung gesammelt an den Verein'}</p>
          {t.deadline && <div className={`tshop-dl ${open ? '' : 'closed'}`}>{open ? <>Bestellschluss <b>{new Date(t.deadline).toLocaleDateString('de-DE')}</b>{days != null && days <= 14 && <> · noch {days} {days === 1 ? 'Tag' : 'Tage'}</>}</> : 'Der Bestellzeitraum ist beendet.'}</div>}
        </div>
      </section>
      {t.note && <p className="tshop-note">{t.note}</p>}
      {logoChoices(t).length > 0 && <div className="tshop-logos"><b>{logoChoices(t).length} Logos zur Auswahl:</b>{logoChoices(t).map((l) => <img key={l.id} src={`/api/upload/${l.id}?w=320`} alt={l.name} title={l.name} />)}</div>}
      <ol className="tshop-steps"><li><b>Artikel wählen</b> Farbe und Größe aussuchen</li><li><b>{logoChoices(t).length ? 'Logo wählen' : t.personalize !== 'aus' ? 'Name / Nummer eintragen' : 'Menge festlegen'}</b> {logoChoices(t).length ? 'auf der Artikelseite' : 'das Vereinslogo ist schon gesetzt'}</li><li><b>Anfrage senden</b> Sie erhalten Ihr Angebot per E-Mail</li></ol>
      <div className="grid">
        {items.map((p) => (
          <Link key={p.id} href={`${productPath(p)}?team=${t.slug}`} className="card">
            <div className="img"><ProductImage p={p} /></div>
            <div className="body">
              <div className="name">{p.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>{p.colors.length} Farben · {p.sizes.length ? `${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}` : ''}</div>
              <div className="price">{(teamFixedPrice(t, p.id) ?? p.price) != null ? <Money net={(teamFixedPrice(t, p.id) ?? p.price)!} label /> : <small style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>Preis auf Anfrage</small>}</div>
            </div>
          </Link>
        ))}
      </div>
      {!items.length && <p className="muted">Hier erscheinen bald die Artikel Ihres Vereins.</p>}
      <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>Fragen zum Team-Shop? Produktberatung: <a className="alink" href="tel:+493040719258">030 40719258</a> · <a className="alink" href="mailto:info@euro-trade.com">info@euro-trade.com</a>{t.contact ? <> · Ansprechpartner im Verein: {t.contact}</> : null}</p>
    </div>
  );
}
