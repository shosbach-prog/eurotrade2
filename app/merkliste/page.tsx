import type { Metadata } from 'next';
import WishlistView from './WishlistView';

export const metadata: Metadata = { title: 'Merkliste' };
export default function Merkliste() { return <WishlistView />; }
