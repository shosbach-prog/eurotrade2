import type { Metadata } from 'next';
import AdminNav from '@/components/AdminNav';
import TeamShopEditor from './TeamShopEditor';
import { listTeamShops, teamOrders } from '@/lib/teamshop';
import { pickItems } from '@/lib/catalog';
import { METHODS, POSITIONS } from '@/lib/deco';
import { shopUrl } from '@/lib/mail';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Team-Shops', robots: { index: false, follow: false } };

export default function TeamShops() {
  const shops = listTeamShops().map((t) => ({ ...t, orders: teamOrders(t.slug) }));
  return (
    <>
      <AdminNav active="teamshops" />
      <h1>Team-Shops</h1>
      <p className="muted" style={{ marginTop: -6, maxWidth: 820 }}>Eigener Shop-Link pro Verein oder Firma: Vereinslogo und Veredelung sind fest eingestellt, Mitglieder wählen nur Artikel, Größe und ggf. Name/Nummer. Alle Bestellungen laufen hier als Sammelbestellung zusammen.</p>
      <TeamShopEditor shops={shops} products={pickItems()} methods={METHODS} positions={POSITIONS} base={shopUrl()} />
    </>
  );
}
