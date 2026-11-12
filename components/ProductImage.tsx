import type { PublicProduct } from '@/lib/types';
import { mid } from '@/lib/img';

/** Echtes Bild aus L-Shop – oder neutraler Platzhalter in der ersten Produktfarbe */
export default function ProductImage({ p, src, hex, priority }: { p: Pick<PublicProduct, 'name' | 'images' | 'colors' | 'category'> & { webp?: boolean; mid?: boolean }; src?: string; hex?: string; priority?: boolean }) {
  // ohne src: Kachel/Vorschau → kleine 480-px-Fassung
  const img = src ?? mid(p.images[0], p.mid, p.webp);
  if (img) return <img className="pimg" src={img} alt={p.name} loading={priority ? 'eager' : 'lazy'} {...(priority ? { fetchPriority: 'high' as const } : {})} decoding="async" />;
  const fill = hex ?? p.colors[0]?.hex ?? '#cfd6df';
  const c = p.category.toLowerCase();
  const shape = c.includes('tasche')
    ? 'M60 70 h80 l8 90 h-96 z M80 70 q0 -30 20 -30 q20 0 20 30'
    : c.includes('cap') || c.includes('mütze')
    ? 'M40 120 q0 -70 60 -70 q60 0 60 70 z M40 120 h130 v10 h-130 z'
    : c.includes('handt')
    ? 'M50 50 h100 v110 h-100 z'
    : 'M70 40 l-40 22 l14 30 l18 -8 v86 h76 v-86 l18 8 l14 -30 l-40 -22 q-6 14 -30 14 q-24 0 -30 -14 z';
  return (
    <svg className="pimg" viewBox="0 0 200 200" role="img" aria-label={p.name}>
      <rect width="200" height="200" fill="#f0f2f5" />
      <path d={shape} fill={fill} stroke="rgba(0,0,0,.18)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
