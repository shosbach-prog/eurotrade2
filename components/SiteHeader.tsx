'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';
import Logo from './Logo';
import UserMenu from './UserMenu';
import { CartButton } from './CartContext';
import { WishlistButton } from './Wishlist';
import { PriceToggle } from './PriceMode';

/** Kopfzeile + Kategorien – entscheidet anhand der AKTUELLEN Adresse (bleibt bei Seitenwechseln ohne Neuladen korrekt) */
export default function SiteHeader({ ok, customerName, admin, cats, shop, domain, deals = 0 }: {
  deals?: number; ok: boolean; customerName: string | null; admin: boolean; cats: { name: string; slug: string }[]; shop: string; domain: string;
}) {
  const path = usePathname() ?? '/';
  const isAdminPath = path.startsWith('/admin');
  const authPath = ['/zugang', '/passwort', '/registrieren'].some((p) => path.startsWith(p));
  const showShop = ok && !authPath && !isAdminPath;
  const showcase = !ok && (path.startsWith('/kategorie/') || path.startsWith('/produkt/'));
  return (
    <>
      <header className="hdr">
        <div className="wrap hdr-row">
          <Link href="/" className="logo" aria-label={`${shop} – Startseite`}><Logo domain={domain} /></Link>
          {showShop ? <>
            <Suspense fallback={<div className="search" />}><SearchBar /></Suspense>
            <div className="hdr-actions">{(showShop || showcase) && <PriceToggle />}<WishlistButton /><CartButton /><UserMenu name={customerName} admin={admin} /></div>
          </> : isAdminPath ? null : (
            <nav className="pub-nav">
              <Link href="/druck-stick" className="hide-sm">Druck & Stick</Link>
              <Link href="/#ablauf" className="hide-sm">So funktioniert’s</Link>
              <Link href="/kontakt">Kontakt</Link>
              {ok ? <UserMenu name={customerName} admin={admin} /> : <>
                <Link href="/registrieren" className="pub-reg">Registrieren</Link>
                <Link href="/zugang" className="pub-login">Anmelden</Link>
              </>}
            </nav>
          )}
        </div>
      </header>
      {(showShop || showcase) && cats.length > 0 && <nav className="catnav"><div className="wrap">
        {cats.map((c) => <Link key={c.slug} href={`/kategorie/${c.slug}`} className={path === `/kategorie/${c.slug}` ? 'on' : undefined}>{c.name}</Link>)}
        {deals > 0 && <Link href="/kategorie/sonderangebote" className={`deal ${path === '/kategorie/sonderangebote' ? 'on' : ''}`}>Sonderangebote</Link>}
      </div></nav>}
    </>
  );
}
