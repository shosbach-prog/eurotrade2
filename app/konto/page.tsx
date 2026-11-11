import type { Metadata } from 'next';
import MyInquiries from './MyInquiries';
export const metadata: Metadata = { title: 'Meine Anfragen', robots: { index: false } };
export default function Konto() { return <MyInquiries />; }
