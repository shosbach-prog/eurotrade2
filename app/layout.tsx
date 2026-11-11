import './globals.css';
import { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import SearchBar from '@/components/SearchBar';
import Logo from '@/components/Logo';
import LogoutLink from '@/components/LogoutLink';
import Contact from '@/components/Contact';
import TrustBadge from '@/components/TrustBadge';
import { CartButton, CartProvider } from '@/components/CartContext';
import { AccountButton, WishlistButton, WishlistProvider } from '@/components/Wishlist';
import { getCategories } from '@/lib/catalog';
import { previewMode, shopClosed } from '@/lib/access';
import { shopAccess } from '@/lib/customer';

const SHOP = process.env.SHOP_NAME ?? 'Euro-Trade';
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { default: `${SHOP} – Textilien & Werbeartikel`, template: `%s | ${SHOP}` },
    description: 'Teamwear und Firmenbekleidung mit Logo: Markentextilien ab 1 Stück, bedruckt oder bestickt. Für Vereine, Unternehmen und Handwerk – Angebot in 24 Stunden.',
    metadataBase: new URL(process.env.SHOP_URL ?? 'https://euro-trade.com'),
    openGraph: { type: 'website', locale: 'de_DE', siteName: 'euro-trade.com', images: [{ url: '/og.png', width: 1200, height: 630, alt: 'euro-trade.com – Teamwear & Firmenbekleidung mit Logo' }] },
    twitter: { card: 'summary_large_image', images: ['/og.png'] },
    // Geschlossener Shop: nur Landingpage und Info-Seite in Suchmaschinen
    // Geschlossener Shop: Landingpage, Infoseiten und Schaufenster (Kategorien/Artikel ohne Preise) indexierbar
    robots: previewMode() || (shopClosed() && !(['/start', '/druck-stick', '/widerruf', '/garantie', '/impressum', '/ueber-uns'].includes(headers().get('x-path') ?? '') || (headers().get('x-path') ?? '').startsWith('/fuer/') || headers().get('x-showcase') === '1')) ? { index: false, follow: false } : undefined,
  };
}
export const dynamic = 'force-dynamic';

/** Organisation + Website für Suchmaschinen (auf jeder Seite) */
function orgSchema() {
  const url = (process.env.SHOP_URL ?? 'https://euro-trade.com').replace(/\/$/, '');
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Store', '@id': `${url}/#org`, name: 'euro-trade.com', alternateName: 'Euro-Trade', url, logo: `${url}/icon.svg`, image: `${url}/og.png`,
      description: 'Teamwear und Firmenbekleidung mit Logo – Markentextilien ab 1 Stück, bedruckt oder bestickt.',
      email: process.env.CONTACT_EMAIL ?? 'info@euro-trade.com', telephone: '+49 173 2648097', founder: { '@type': 'Person', name: 'Sebastian Hosbach' },
      address: { '@type': 'PostalAddress', streetAddress: 'Seehan 28', postalCode: '44263', addressLocality: 'Dortmund', addressCountry: 'DE' },
      areaServed: ['DE', 'AT', 'CH'] },
    { '@type': 'WebSite', '@id': `${url}/#website`, url, name: 'euro-trade.com', inLanguage: 'de-DE', publisher: { '@id': `${url}/#org` } },
  ] };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const gated = shopClosed();
  const path = headers().get('x-path') ?? '/';
  const isPublic = ['/fuer', '/ueber-uns', '/garantie', '/bewerten', '/widerruf', '/newsletter', '/start', '/druck-stick', '/zugang', '/passwort', '/registrieren', '/kontakt', '/impressum', '/datenschutz', '/angebot', '/admin'].some((p) => path === p || path.startsWith(p + '/'));
  const { ok, customer } = await shopAccess();
  // Code im Admin gesperrt/gelöscht -> zurück zur Anmeldung
  const showcase = !ok && headers().get('x-showcase') === '1';
  if (!ok && !isPublic && !showcase) redirect('/zugang');
  const open = ok && !path.startsWith('/zugang') && !path.startsWith('/passwort') && !path.startsWith('/registrieren') && !path.startsWith('/admin');
  const cats = open ? getCategories(customer) : showcase ? getCategories() : [];
  return (
    <html lang="de">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema()) }} />
        <CartProvider><WishlistProvider>
          {previewMode() && ok && !path.startsWith('/start') && <div className="preview-bar">Vorschau-Modus – nur für Sie sichtbar. Preise sind Platzhalter. Kunden-Codes sind gesperrt, bis Sie <code>SHOP_PREVIEW=false</code> setzen.</div>}
          <header className="hdr">
            <div className="wrap hdr-row">
              <Link href="/" className="logo" aria-label={`${SHOP} – Startseite`}><Logo domain={process.env.SHOP_DOMAIN ?? 'euro-trade.com'} /></Link>
              {open ? <>
                <Suspense fallback={<div className="search" />}><SearchBar /></Suspense>
                <div className="hdr-actions"><AccountButton /><WishlistButton /><CartButton /></div>
              </> : !path.startsWith('/admin') && <nav className="pub-nav">
                <Link href="/druck-stick" className="hide-sm">Druck & Stick</Link>
                <Link href="/#ablauf" className="hide-sm">So funktioniert’s</Link>
                <Link href="/kontakt">Kontakt</Link>
                <Link href="/registrieren" className="pub-reg">Registrieren</Link>
                <Link href="/zugang" className="pub-login">Anmelden</Link>
              </nav>}
            </div>
          </header>
          {(open || showcase) && <nav className="catnav"><div className="wrap">
            {cats.map((c) => <Link key={c.slug} href={`/kategorie/${c.slug}`}>{c.name}</Link>)}
          </div></nav>}
          <main className="wrap">{children}</main>
          <footer className="ft">
            <div className="wrap ft-grid">
              <div className="ft-brand">
                <Link href="/" className="logo" aria-label={`${SHOP} – Startseite`}><Logo domain={process.env.SHOP_DOMAIN ?? 'euro-trade.com'} /></Link>
                <p>Markentextilien ab 1 Stück – bedruckt oder bestickt, aus einer Hand. Für Vereine, Unternehmen und Handwerk.</p>
                <div className="ft-contact">
                  <a href="tel:+491732648097"><span aria-hidden>☎</span> 0173 2648097</a>
                  <a href="mailto:info@euro-trade.com"><span aria-hidden>✉</span> info@euro-trade.com</a>
                  <span><span aria-hidden>⌂</span> Seehan 28 · 44263 Dortmund</span>
                </div>
              </div>
              <nav className="ft-col" aria-label="Shop">
                <h4>Shop</h4>
                {open ? <Link href="/konto">Meine Anfragen</Link> : <><Link href="/zugang">Anmelden</Link><Link href="/registrieren">Registrieren</Link></>}
                <Link href="/kontakt">Kontakt & Anfrage</Link>
                <Link href="/druck-stick">Druck & Stick</Link>
                <Link href="/#newsletter">Newsletter & Rabatt</Link>
              </nav>
              <nav className="ft-col" aria-label="Branchen">
                <h4>Für</h4>
                <Link href="/fuer/vereine">Vereine</Link>
                <Link href="/fuer/unternehmen">Unternehmen</Link>
                <Link href="/fuer/handwerk">Handwerk</Link>
                <Link href="/fuer/gastronomie">Gastronomie</Link>
              </nav>
              <nav className="ft-col" aria-label="Service">
                <h4>Service</h4>
                <Link href="/ueber-uns">Über uns</Link>
                <Link href="/garantie">Zufriedenheitsgarantie</Link>
                <Link href="/widerruf">Rückgabe & Widerruf</Link>
                <Link href="/impressum">Impressum</Link>
                <Link href="/datenschutz">Datenschutz</Link>
              </nav>
            </div>
            <div className="ft-bottom">
              <div className="wrap">
                <span>© {new Date().getFullYear()} {SHOP} · Alle Preise netto zzgl. MwSt. und Versand</span>
                {gated && customer && <span>Angemeldet als <b>{customer.name}</b> · <LogoutLink /></span>}
              </div>
            </div>
          </footer>
          {!path.startsWith('/admin') && <TrustBadge />}
          {!path.startsWith('/admin') && <Contact whatsapp={process.env.CONTACT_WHATSAPP ?? '491732648097'} phone={process.env.CONTACT_PHONE ?? '0173 2648097'} email={process.env.CONTACT_EMAIL ?? 'info@euro-trade.com'} />}
        </WishlistProvider></CartProvider>
      </body>
    </html>
  );
}
