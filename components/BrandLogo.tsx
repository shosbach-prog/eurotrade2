import { brandLogo } from '@/lib/brands';

/** Herstellerlogo – fällt auf den Namen zurück, wenn kein Logo hinterlegt ist */
export default function BrandLogo({ name, h = 18, className = '' }: { name: string; h?: number; className?: string }) {
  const src = brandLogo(name);
  if (!src) return <span className={`blogo-txt ${className}`}>{name}</span>;
  return <img className={`blogo ${className}`} src={src} alt={name} title={name} loading="lazy" style={{ height: h }} />;
}
