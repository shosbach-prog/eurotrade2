import { catPath } from '@/lib/format';
import Link from 'next/link';
import { sized, srcSet } from '@/lib/img';

export type Tile = { slug: string; name: string; count: number; image?: string };
/** Kategorien als Bildkacheln – link=false: führt zur Anfrage statt zur Kategorie (Vorschau-Modus) */
export default function CategoryTiles({ tiles, link }: { tiles: Tile[]; link: boolean }) {
  return (
    <div className="ct-grid">
      {tiles.map((t) => (
        <Link key={t.slug} href={link ? catPath(t.slug) : '#preis'} className="ct">
          {t.image ? <img src={sized(t.image, 360)} srcSet={srcSet(t.image, [240, 360, 480, 720])} sizes="(max-width: 700px) 46vw, 280px" width={360} height={450} alt="" loading="lazy" decoding="async" /> : <span className="ct-ph" />}
          <span className="ct-label"><b>{t.name}</b><span>{t.count} {t.count === 1 ? 'Artikel' : 'Artikel'} →</span></span>
        </Link>
      ))}
    </div>
  );
}
