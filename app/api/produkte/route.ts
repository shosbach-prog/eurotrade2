import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/catalog';
import { getCustomer } from '@/lib/customer';

/** Produkte zu einer Liste von IDs (für die Merkliste) */
export async function GET(req: Request) {
  const ctx = await getCustomer();
  const ids = (new URL(req.url).searchParams.get('ids') ?? '').split(',').filter(Boolean).slice(0, 200);
  const products = ids.flatMap((id) => { const p = getProduct(id, ctx); return p ? [p] : []; });
  return NextResponse.json(products);
}
