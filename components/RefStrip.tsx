import type { Reference } from '@/lib/store';

/** Referenzfotos auf Artikel-/Kategorieseiten */
export default function RefStrip({ refs, title = 'So sieht es bei unseren Kunden aus' }: { refs: Reference[]; title?: string }) {
  if (!refs.length) return null;
  return (
    <section className="refstrip" aria-label="Referenzen">
      <h2>{title}</h2>
      <div className="l-refs">
        {refs.map((r) => (
          <figure key={r.id} className="box l-ref">
            {r.imageId && <img src={`/api/bild/${r.imageId}`} alt={r.title} loading="lazy" />}
            <figcaption>{r.tag && <span className="l-tag">{r.tag}</span>}<b>{r.title}</b>{r.text && <span>{r.text}</span>}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
