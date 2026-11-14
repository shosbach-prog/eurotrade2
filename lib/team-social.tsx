import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import { getProduct } from './catalog';
import { rankedMotifs, teamFixedPrice, type TeamShop } from './teamshop';
import { DATA, UPLOADS, readJSON } from './store';
import { gross } from './pricing';

/** Teilen-Kit für Channel-/Künstler-Shops: Story (1080×1920) und Post (1080×1080) als JPEG, mit Motiven, Preis und Link */
export type SocialKind = 'story' | 'post';
const SIZE: Record<SocialKind, [number, number]> = { story: [1080, 1920], post: [1080, 1080] };
const font = (f: string) => { try { return fs.readFileSync(path.join(process.cwd(), 'seed', 'fonts', f)); } catch { return null; } };
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
function dataUri(file: string) {
  const ext = file.split('.').pop()!.toLowerCase();
  if (!MIME[ext] || !fs.existsSync(file)) return null;
  return `data:${MIME[ext]};base64,${fs.readFileSync(file).toString('base64')}`;
}
const metaExt = (id: string) => readJSON<{ ext: string } | null>(path.join(UPLOADS, `${id}.json`), null)?.ext ?? '';
const upload = (id: string) => { const e = metaExt(id); return e ? dataUri(path.join(UPLOADS, `${id}.${e}`)) : null; };
const publicImg = (src?: string) => (src && src.startsWith('/') ? dataUri(path.join(process.cwd(), 'public', src)) : null);

export async function socialImage(t: TeamShop, kind: SocialKind, shopUrl: string): Promise<Buffer> {
  const [W, H] = SIZE[kind];
  const motifs = rankedMotifs(t);
  const n = kind === 'story' ? 6 : 3;
  const key = JSON.stringify(['s4', kind, t.name, t.price, motifs.slice(0, n).map((m) => m.id), t.items.slice(0, n), shopUrl]);
  const hash = crypto.createHash('sha1').update(key).digest('hex').slice(0, 12);
  const dir = path.join(DATA, 'og'); const file = path.join(dir, `${kind}-${t.slug}-${hash}.jpg`);
  if (fs.existsSync(file)) return fs.readFileSync(file);

  const covers = motifs.length > 0 && motifs.slice(0, n).every((m) => /^jpe?g$/.test(metaExt(m.id)));
  const pics = (motifs.length ? motifs.slice(0, n).map((m) => upload(m.id)) : t.items.slice(0, n).map((id) => publicImg(getProduct(id, null)?.images[0]))).filter((x): x is string => !!x);
  const fixed = t.items.map((id) => teamFixedPrice(t, id)).find((x) => x != null) ?? null;
  const anton = font('anton-latin-400-normal.woff'), inter = font('inter-latin-600-normal.woff');
  const dark = covers;
  const cols = kind === 'story' ? 2 : 3;
  const cell = kind === 'story' ? 390 : 310;
  const link = `${shopUrl.replace(/^https?:\/\//, '')}/team/${t.slug}`;
  const accent = dark ? '#ef4444' : '#ffc21a';

  const img = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: kind === 'story' ? '130px 60px 120px' : '50px 50px 46px', background: dark ? 'linear-gradient(180deg,#2a0606 0%,#0a0a0a 55%)' : 'linear-gradient(180deg,#1d4ed8 0%,#0f172a 100%)', color: '#fff', fontFamily: inter ? 'Inter' : 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 30, letterSpacing: 5, color: accent, textTransform: 'uppercase' }}>{dark ? 'Offizieller Merch' : 'Offizieller Shop'}</div>
          <div style={{ display: 'flex', fontFamily: anton ? 'Anton' : undefined, fontSize: t.name.length > 14 ? (kind === 'story' ? 110 : 84) : kind === 'story' ? 150 : 104, lineHeight: 1, marginTop: 14, textTransform: 'uppercase', textAlign: 'center' }}>{t.name}</div>
          <div style={{ display: 'flex', fontSize: 34, marginTop: 14, color: dark ? '#e5e5e5' : '#dbe4ff' }}>{motifs.length ? `${motifs.length} Motive · gedruckt ab 1 Stück` : 'Mit Logo · ab 1 Stück'}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, width: cols * cell + (cols - 1) * 20 }}>
          {pics.map((src, i) => dark
            ? <img key={i} src={src} width={cell} height={cell} style={{ objectFit: 'cover', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,.6)' }} />
            : <div key={i} style={{ width: cell, height: cell, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 24 }}><img src={src} width={cell - 30} height={cell - 30} style={{ objectFit: 'contain' }} /></div>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: kind === 'story' ? 18 : 10 }}>
          {fixed != null && <div style={{ display: 'flex', background: accent, color: dark ? '#fff' : '#0f172a', fontSize: kind === 'story' ? 44 : 36, padding: kind === 'story' ? '14px 34px' : '10px 26px', borderRadius: 16 }}>{`ab ${gross(fixed).toFixed(2).replace('.', ',')} € inkl. Druck`}</div>}
          {kind === 'story' && <div style={{ display: 'flex', fontSize: 34, color: '#fff' }}>Jetzt bestellen – Link antippen</div>}
          <div style={{ display: 'flex', fontSize: kind === 'story' ? 36 : 30, color: dark ? '#d4d4d4' : '#c7d2fe' }}>{link}</div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: [...(inter ? [{ name: 'Inter', data: inter, weight: 600 as const, style: 'normal' as const }] : []), ...(anton ? [{ name: 'Anton', data: anton, weight: 400 as const, style: 'normal' as const }] : [])] },
  );
  const png = PNG.sync.read(Buffer.from(await img.arrayBuffer()));
  const buf = Buffer.from(jpeg.encode({ data: png.data, width: png.width, height: png.height }, 88).data);
  try { fs.mkdirSync(dir, { recursive: true }); for (const f of fs.readdirSync(dir)) if (f.startsWith(`${kind}-${t.slug}-`) && f !== path.basename(file)) fs.unlinkSync(path.join(dir, f)); fs.writeFileSync(file, buf); } catch {}
  return buf;
}
