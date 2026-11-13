import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import { getProduct } from '@/lib/catalog';
import { getTeamShop, rankedMotifs, teamFixedPrice } from '@/lib/teamshop';
import { DATA, UPLOADS, readJSON } from '@/lib/store';
import { gross } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Vorschaubild beim Teilen des Shop-Links (WhatsApp, Telegram, Facebook …): 1200×630 mit Motiven bzw. Artikeln */
const W = 1200, H = 630;
const font = (f: string) => { try { return fs.readFileSync(path.join(process.cwd(), 'seed', 'fonts', f)); } catch { return null; } };
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
function dataUri(file: string) {
  const ext = file.split('.').pop()!.toLowerCase();
  if (!MIME[ext] || ext === 'webp' || !fs.existsSync(file)) return null;
  return `data:${MIME[ext]};base64,${fs.readFileSync(file).toString('base64')}`;
}
const upload = (id: string) => { const m = readJSON<{ ext: string } | null>(path.join(UPLOADS, `${id}.json`), null); return m ? dataUri(path.join(UPLOADS, `${id}.${m.ext}`)) : null; };
const publicImg = (src?: string) => (src && src.startsWith('/') ? dataUri(path.join(process.cwd(), 'public', src)) : null);

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const t = getTeamShop(params.slug);
  if (!t) return new Response('Nicht gefunden', { status: 404 });
  const motifs = rankedMotifs(t);
  // Cache je Shop-Stand (Motive/Artikel/Name/Preis) – das Rendern großer Motive dauert
  const key = JSON.stringify(['v3', t.name, t.price, motifs.slice(0, 6).map((m) => m.id), t.items.slice(0, 6), t.logoId]);
  const hash = crypto.createHash('sha1').update(key).digest('hex').slice(0, 12);
  const dir = path.join(DATA, 'og');
  const file = path.join(dir, `team-${t.slug}-${hash}.jpg`);
  const headers = { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' };
  if (fs.existsSync(file)) return new Response(fs.readFileSync(file), { headers });

  // Cover-Modus: vollflächige Motive (JPG, z. B. Album-Cover) groß und randlos auf dunklem Grund
  const extOf = (id: string) => readJSON<{ ext: string } | null>(path.join(UPLOADS, `${id}.json`), null)?.ext ?? '';
  const covers = motifs.length > 0 && motifs.slice(0, 6).every((m) => /^jpe?g$/.test(extOf(m.id)));
  const pics = (motifs.length ? motifs.slice(0, 6).map((m) => upload(m.id)) : t.items.slice(0, 6).map((id) => { const p = getProduct(id, null); return publicImg(p?.images[0]); })).filter((x): x is string => !!x);
  const logo = t.logoId ? upload(t.logoId) : null;
  const fixed = t.items.map((id) => teamFixedPrice(t, id)).find((x) => x != null) ?? null;
  const sub = motifs.length
    ? `${motifs.length} Motive · Shirt wählen · gedruckt ab 1 Stück`
    : `${t.method === 'Stick' ? 'Bestickt' : 'Bedruckt'} mit Logo · ab 1 Stück`;
  const anton = font('anton-latin-400-normal.woff'), inter = font('inter-latin-600-normal.woff');
  const cell = pics.length > 4 ? 182 : 270;

  const leftW = covers ? 470 : 560;
  const priceChip = fixed != null ? <div style={{ display: 'flex', alignSelf: 'flex-start', background: '#ffc21a', color: '#0f172a', fontSize: 28, padding: '10px 18px', borderRadius: 12, whiteSpace: 'nowrap' }}>{`ab ${gross(fixed).toFixed(2).replace('.', ',')} € inkl. Druck`}</div> : null;
  const cov = 214;
  const img = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', background: covers ? '#0a0a0a' : '#0f172a', fontFamily: inter ? 'Inter' : 'sans-serif' }}>
        <div style={{ width: leftW, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 44px', background: covers ? 'linear-gradient(160deg,#2a0606 0%,#0a0a0a 70%)' : 'linear-gradient(135deg,#1d4ed8 0%,#0f172a 100%)', color: '#fff' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 22, letterSpacing: 3, color: covers ? '#ef4444' : '#ffc21a', textTransform: 'uppercase' }}>{covers ? 'Offizieller Merch' : 'Offizieller Shop'}</div>
            {logo && <img src={logo} width={110} height={110} style={{ objectFit: 'contain', marginTop: 18 }} />}
            <div style={{ display: 'flex', fontFamily: anton ? 'Anton' : undefined, fontSize: t.name.length > 14 ? 72 : covers ? 92 : 96, lineHeight: 1.02, marginTop: 18, textTransform: 'uppercase' }}>{t.name}</div>
            <div style={{ display: 'flex', fontSize: 27, lineHeight: 1.35, marginTop: 18, color: covers ? '#e5e5e5' : '#dbe4ff' }}>{covers ? `${motifs.length} Cover-Motive als Shirt · gedruckt ab 1 Stück` : sub}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {priceChip}
            <div style={{ display: 'flex', fontSize: 22, color: covers ? '#a3a3a3' : '#c7d2fe', whiteSpace: 'nowrap' }}>{`euro-trade.com/team/${t.slug}`}</div>
          </div>
        </div>
        {covers ? (
          <div style={{ flex: 1, height: H, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 10, padding: 12 }}>
            {pics.map((src, i) => <img key={i} src={src} width={cov} height={cov} style={{ objectFit: 'cover', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,.6)' }} />)}
          </div>
        ) : (
          <div style={{ flex: 1, height: H, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 14, padding: 20, background: '#f1f5f9' }}>
            {pics.map((src, i) => (
              <div key={i} style={{ width: cell, height: cell, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: 16, boxShadow: '0 4px 14px rgba(15,23,42,.12)' }}>
                <img src={src} width={cell - 16} height={cell - 16} style={{ objectFit: 'contain' }} />
              </div>
            ))}
            {!pics.length && <div style={{ display: 'flex', fontSize: 40, color: '#0f172a' }}>{t.name}</div>}
          </div>
        )}
      </div>
    ),
    { width: W, height: H, fonts: [...(inter ? [{ name: 'Inter', data: inter, weight: 600 as const, style: 'normal' as const }] : []), ...(anton ? [{ name: 'Anton', data: anton, weight: 400 as const, style: 'normal' as const }] : [])] },
  );
  // Als JPEG ausliefern: WhatsApp zeigt Vorschaubilder nur bis ca. 600 KB zuverlässig (PNG mit Fotos wäre ~750 KB)
  const png = PNG.sync.read(Buffer.from(await img.arrayBuffer()));
  const buf = Buffer.from(jpeg.encode({ data: png.data, width: png.width, height: png.height }, 84).data);
  try { fs.mkdirSync(dir, { recursive: true }); for (const f of fs.readdirSync(dir)) if (f.startsWith(`team-${t.slug}-`) && f !== path.basename(file)) fs.unlinkSync(path.join(dir, f)); fs.writeFileSync(file, buf); } catch {}
  return new Response(buf, { headers });
}
