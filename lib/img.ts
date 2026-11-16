/** Externe L-Shop-Bilder (bis 665 px / Originalgröße als JPEG) laufen über /api/img → verkleinerte WebP */
const EXT = /^https:\/\/shop\.l-shop-team\.de\//;
/** Verkleinerte WebP-Fassung über /api/img (externe L-Shop-Bilder oder lokale JPEG/PNG) */
export const sized = (src: string | undefined, w: number) => (src && (EXT.test(src) || /^\/p\/.+\.(jpe?g|png)$/i.test(src)) ? `/api/img?u=${encodeURIComponent(src)}&w=${w}` : src);
/** Lokales Produktbild als WebP (nur wenn serverseitig geprüft: p.webp) */
export const webp = (src: string | undefined, on?: boolean) => (on && src && src.startsWith('/p/') ? src.replace(/\.jpe?g$/i, '.webp') : src && EXT.test(src) ? sized(src, 1000) : src);
/** Kleine Fassung (480 px) für Kacheln und Vorschaubilder – nur wenn serverseitig geprüft: p.mid */
export const mid = (src: string | undefined, on?: boolean, w?: boolean) => (on && src && src.startsWith('/p/') ? src.replace(/\.(jpe?g|webp)$/i, '.m.webp') : src && EXT.test(src) ? sized(src, 480) : webp(src, w));
/** Absolute Bild-URL auf der eigenen Domain (für Google-Feed und strukturierte Daten): externe L-Shop-Bilder laufen über /api/img */
export const ownImage = (src: string, site: string) => (src.startsWith('/') ? `${site}${src}` : EXT.test(src) ? `${site}/api/img?u=${encodeURIComponent(src)}&w=1000` : src);
/** srcset über /api/img – der Browser lädt nur die Breite, die er für Anzeigegröße und Pixeldichte braucht (sonst undefined) */
export const srcSet = (src: string | undefined, widths: number[]) => (src && (EXT.test(src) || /^\/(p|brands)\/.+\.(jpe?g|png|webp)$/i.test(src)) ? widths.map((w) => `/api/img?u=${encodeURIComponent(src)}&w=${w} ${w}w`).join(', ') : undefined);
