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
import { CartButton, CartProvider } from '@/components/CartContext';
import { AccountButton, WishlistButton, WishlistProvider } from '@/components/Wishlist';
import { getCategories } from '@/lib/catalog';
import { previewMode, shopClosed } from '@/lib/access';
import { shopAccess } from '@/lib/customer';

const SHOP = process.env.SHOP_NAME ?? 'Euro-Trade';
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { default: `${SHOP} – Textilien & Werbeartikel`, template: `%s | ${SHOP}` },
    description: 'T-Shirts, Polos, Hoodies, Jacken, Caps und Taschen für Druck und Stick – schnell finden, Anfrage in einer Minute.',
    metadataBase: new URL(process.env.SHOP_URL ?? 'https://euro-trade.com'),
    // Geschlossener Shop: nur Landingpage und Info-Seite in Suchmaschinen
    robots: previewMode() || (shopClosed() && !['/start', '/druck-stick', '/impressum'].includes(headers().get('x-path') ?? '')) ? { index: false, follow: false } : undefined,
  };
}
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const gated = shopClosed();
  const path = headers().get('x-path') ?? '/';
  const isPublic = ['/start', '/druck-stick', '/zugang', '/impressum', '/datenschutz', '/angebot', '/admin'].some((p) => path === p || path.startsWith(p + '/'));
  const { ok, customer } = await shopAccess();
  // Code im Admin gesperrt/gelöscht -> zurück zur Anmeldung
  if (!ok && !isPublic) redirect('/zugang');
  const open = ok && !path.startsWith('/zugang') && !path.startsWith('/admin');
  const cats = open ? getCategories(customer) : [];
  return (
    <html lang="de">
      <body>
        <CartProvider><WishlistProvider>
          {previewMode() && ok && !path.startsWith('/start') && <div className="preview-bar">Vorschau-Modus – nur für Sie sichtbar. Preise sind Platzhalter. Kunden-Codes sind gesperrt, bis Sie <code>SHOP_PREVIEW=false</code> setzen.</div>}
          <header className="hdr">
            <div className="wrap hdr-row">
              <Link href="/" className="logo" aria-label={`${SHOP} – Startseite`}><Logo name={SHOP} /></Link>
              {open ? <>
                <Suspense fallback={<div className="search" />}><SearchBar /></Suspense>
                <div className="hdr-actions"><AccountButton /><WishlistButton /><CartButton /></div>
              </> : !path.startsWith('/admin') && <nav className="pub-nav">
                <Link href="/druck-stick" className="hide-sm">Druck & Stick</Link>
                <Link href="/#ablauf" className="hide-sm">So funktioniert’s</Link>
                <Link href="/#anfragen" className="hide-sm">Zugang anfragen</Link>
                <Link href="/zugang" className="pub-login">Anmelden</Link>
              </nav>}
            </div>
          </header>
          {open && <nav className="catnav"><div className="wrap">
            {cats.map((c) => <Link key={c.slug} href={`/kategorie/${c.slug}`}>{c.name}</Link>)}
          </div></nav>}
          <main className="wrap">{children}</main>
          <footer><div className="wrap">
            <span>© {new Date().getFullYear()} {SHOP} · Alle Preise netto zzgl. MwSt. und Versand</span>
            <span>{open && <><Link href="/konto">Meine Anfragen</Link> · </>}<Link href="/druck-stick">Druck & Stick</Link> · <Link href="/impressum">Impressum</Link> · <Link href="/datenschutz">Datenschutz</Link>{gated && customer && <> · {customer.name} · <LogoutLink /></>}</span>
          </div></footer>
          {!path.startsWith('/admin') && <Contact whatsapp={process.env.CONTACT_WHATSAPP ?? '491732648097'} phone={process.env.CONTACT_PHONE ?? '0173 2648097'} email={process.env.CONTACT_EMAIL ?? 'info@euro-trade.com'} />}
        </WishlistProvider></CartProvider>
      </body>
    </html>
  );
}
