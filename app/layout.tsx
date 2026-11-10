import './globals.css';
import { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import SearchBar from '@/components/SearchBar';
import Logo from '@/components/Logo';
import LogoutLink from '@/components/LogoutLink';
import { CartButton, CartProvider } from '@/components/CartContext';
import { WishlistButton, WishlistProvider } from '@/components/Wishlist';
import { getCategories } from '@/lib/catalog';
import { ACCESS_COOKIE, accessEnabled, codeForToken } from '@/lib/access';

const SHOP = process.env.SHOP_NAME ?? 'Euro-Trade';
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { default: `${SHOP} – Textilien & Werbeartikel`, template: `%s | ${SHOP}` },
    description: 'T-Shirts, Polos, Hoodies, Jacken, Caps und Taschen für Druck und Stick – schnell finden, Anfrage in einer Minute.',
    metadataBase: new URL(process.env.SHOP_URL ?? 'https://euro-trade.com'),
    // Geschlossener Shop: nicht in Suchmaschinen
    robots: accessEnabled() ? { index: false, follow: false } : undefined,
  };
}
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const gated = accessEnabled();
  const open = !gated || !!(await codeForToken(cookies().get(ACCESS_COOKIE)?.value));
  const cats = open ? getCategories() : [];
  return (
    <html lang="de">
      <body>
        <CartProvider><WishlistProvider>
          <header className="hdr">
            <div className="wrap hdr-row">
              <Link href="/" className="logo" aria-label={`${SHOP} – Startseite`}><Logo name={SHOP} /></Link>
              {open && <>
                <Suspense fallback={<div className="search" />}><SearchBar /></Suspense>
                <div className="hdr-actions"><WishlistButton /><CartButton /></div>
              </>}
            </div>
          </header>
          {open && <nav className="catnav"><div className="wrap">
            {cats.map((c) => <Link key={c.slug} href={`/kategorie/${c.slug}`}>{c.name}</Link>)}
          </div></nav>}
          <main className="wrap">{children}</main>
          <footer><div className="wrap">
            <span>© {new Date().getFullYear()} {SHOP} · Alle Preise netto zzgl. MwSt. und Versand</span>
            <span><Link href="/impressum">Impressum</Link> · <Link href="/datenschutz">Datenschutz</Link>{gated && open && <> · <LogoutLink /></>}</span>
          </div></footer>
        </WishlistProvider></CartProvider>
      </body>
    </html>
  );
}
