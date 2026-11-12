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
import MegaMenu from './MegaMenu';
import { isCategoryUrl, isProductUrl } from '@/lib/format';
import type { Menu } from '@/lib/menu-defs';

/** Kopfzeile + Kategorien – entscheidet anhand der AKTUELLEN Adresse (bleibt bei Seitenwechseln ohne Neuladen korrekt) */
export default function SiteHeader({ ok, customerName, admin, menu, shop, domain }: {
  menu: Menu; ok: boolean; customerName: string | null; admin: boolean; shop: string; domain: string;
}) {
  const path = usePathname() ?? '/';
  const isAdminPath = path.startsWith('/admin');
  const authPath = ['/zugang', '/passwort', '/registrieren'].some((p) => path.startsWith(p));
  const showShop = ok && !authPath && !isAdminPath;
  const showcase = !ok && (isCategoryUrl(path) || isProductUrl(path));
  return (
    <>
      <header className="hdr">
        <div className="wrap hdr-row">
          <Link href="/" className="logo" aria-label={`${shop} – Startseite`}><Logo domain={domain} /></Link>
          {showShop ? <>
            <Suspense fallback={<div className="search" />}><SearchBar /></Suspense>
            <div className="hdr-actions"><PriceToggle /><WishlistButton /><CartButton /><UserMenu name={customerName} admin={admin} /></div>
          </> : isAdminPath ? null : (
            <nav className="pub-nav">
              {showcase && <PriceToggle className="pub-pt" />}
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
      {(showShop || showcase) && menu.groups.length > 0 && <MegaMenu menu={menu} />}
    </>
  );
}
