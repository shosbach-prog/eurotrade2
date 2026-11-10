import type { Metadata } from 'next';
import WishlistView from './WishlistView';

export const metadata: Metadata = { title: 'Merkliste' };
export default function Merkliste({ searchParams }: { searchParams: { liste?: string } }) {
  const shared = (searchParams.liste ?? '').split(',').map((x) => x.trim()).filter((x) => /^[a-z0-9-]{1,60}$/.test(x)).slice(0, 100);
  return <WishlistView shared={shared.length ? shared : null} />;
}
