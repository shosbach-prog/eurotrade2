import './globals.css';
import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import SearchBar from '@/components/SearchBar';
import { CartButton, CartProvider } from '@/components/CartContext';
import { getCategories } from '@/lib/catalog';

const SHOP = process.env.SHOP_NAME ?? 'Euro-Trade';
export const metadata: Metadata = {
  title: { default: `${SHOP} – Textilien & Werbeartikel`, template: `%s | ${SHOP}` },
  description: 'T-Shirts, Polos, Hoodies, Jacken, Caps und Taschen für Druck und Stick – schnell finden, Anfrage in einer Minute.',
  metadataBase: new URL(process.env.SHOP_URL ?? 'https://euro-trade.com'),
};
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cats = getCategories();
  const [a, b] = SHOP.split('-');
  return (
    <html lang="de">
      <body>
        <CartProvider>
          <header className="hdr">
            <div className="wrap hdr-row">
              <Link href="/" className="logo">{b ? <>{a}-<span>{b}</span></> : SHOP}</Link>
              <Suspense fallback={<div className="search" />}><SearchBar /></Suspense>
              <CartButton />
            </div>
          </header>
          <nav className="catnav"><div className="wrap">
            {cats.map((c) => <Link key={c.slug} href={`/kategorie/${c.slug}`}>{c.name}</Link>)}
          </div></nav>
          <main className="wrap">{children}</main>
          <footer><div className="wrap">
            <span>© {new Date().getFullYear()} {SHOP} · Alle Preise netto zzgl. MwSt. und Versand</span>
            <span><Link href="/impressum">Impressum</Link> · <Link href="/datenschutz">Datenschutz</Link></span>
          </div></footer>
        </CartProvider>
      </body>
    </html>
  );
}
