import fs from 'node:fs';
import path from 'node:path';
import { DRUCK, checkPrint, printFileFor } from '@/lib/druck';

/** Druckdatei zu einer Art.-Nr. – nur mit gültiger Signatur (Link aus Anfrage/Admin, z. B. für den Drucker) */
export async function GET(req: Request, props: { params: Promise<{ sku: string }> }) {
  const params = await props.params;
  const sku = decodeURIComponent(params.sku);
  if (!(await checkPrint(sku, new URL(req.url).searchParams.get('k')))) return new Response('Nicht gefunden', { status: 404 });
  const name = printFileFor(sku)!;
  const file = path.join(DRUCK, path.basename(name));
  if (!fs.existsSync(file)) return new Response('Nicht gefunden', { status: 404 });
  return new Response(fs.readFileSync(file), { headers: { 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`${sku.toUpperCase()}_${name}`)}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=3600', 'X-Robots-Tag': 'noindex' } });
}
