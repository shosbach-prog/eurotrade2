import { catPath } from '@/lib/format';
import Link from 'next/link';
import { sized } from '@/lib/img';

export type Tile = { slug: string; name: string; count: number; image?: string };
/** Kategorien als Bildkacheln – link=false: führt zur Anfrage statt zur Kategorie (Vorschau-Modus) */
export default function CategoryTiles({ tiles, link }: { tiles: Tile[]; link: boolean }) {
  return (
    <div className="ct-grid">
      {tiles.map((t) => (
        <Link key={t.slug} href={link ? catPath(t.slug) : '#preis'} className="ct">
          {t.image ? <img src={sized(t.image, 480)} alt="" loading="lazy" decoding="async" /> : <span className="ct-ph" />}
          <span className="ct-label"><b>{t.name}</b><span>{t.count} {t.count === 1 ? 'Artikel' : 'Artikel'} →</span></span>
        </Link>
      ))}
    </div>
  );
}
