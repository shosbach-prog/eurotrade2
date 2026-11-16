import { brandLogo } from '@/lib/brands';
import SIZES from '@/lib/brand-sizes.json';

// Logos liegen als große PNG vor – verkleinert als WebP ausliefern (1x/2x)
const small = (src: string, w: number) => (/^\/brands\/.+\.png$/i.test(src) ? `/api/img?u=${encodeURIComponent(src)}&w=${w}` : src);

/** Herstellerlogo – fällt auf den Namen zurück, wenn kein Logo hinterlegt ist */
export default function BrandLogo({ name, h = 18, className = '' }: { name: string; h?: number; className?: string }) {
  const src = brandLogo(name);
  if (!src) return <span className={`blogo-txt ${className}`}>{name}</span>;
  // Breite aus dem Seitenverhältnis der Datei (lib/brand-sizes.json) – der Browser reserviert den Platz, bevor das Logo geladen ist
  const dim = (SIZES as unknown as Record<string, [number, number]>)[src.split('/').pop()!];
  const w = dim ? Math.max(1, Math.round((h * dim[0]) / dim[1])) : undefined;
  return <img className={`blogo ${className}`} src={small(src, 240)} srcSet={/^\/brands\/.+\.png$/i.test(src) ? `${small(src, 240)} 1x, ${small(src, 480)} 2x` : undefined} alt={name} title={name} width={w} height={w ? h : undefined} loading="lazy" decoding="async" style={{ height: h }} />;
}
