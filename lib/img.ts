/** Externe L-Shop-Bilder (bis 665 px / Originalgröße als JPEG) laufen über /api/img → verkleinerte WebP */
const EXT = /^https:\/\/shop\.l-shop-team\.de\//;
/** Verkleinerte WebP-Fassung über /api/img (externe L-Shop-Bilder oder lokale JPEG/PNG) */
export const sized = (src: string | undefined, w: number) => (src && (EXT.test(src) || /^\/p\/.+\.(jpe?g|png)$/i.test(src)) ? `/api/img?u=${encodeURIComponent(src)}&w=${w}` : src);
/** Lokales Produktbild als WebP (nur wenn serverseitig geprüft: p.webp) */
export const webp = (src: string | undefined, on?: boolean) => (on && src && src.startsWith('/p/') ? src.replace(/\.jpe?g$/i, '.webp') : src && EXT.test(src) ? sized(src, 1000) : src);
/** Kleine Fassung (480 px) für Kacheln und Vorschaubilder – nur wenn serverseitig geprüft: p.mid */
export const mid = (src: string | undefined, on?: boolean, w?: boolean) => (on && src && src.startsWith('/p/') ? src.replace(/\.(jpe?g|webp)$/i, '.m.webp') : src && EXT.test(src) ? sized(src, 480) : webp(src, w));
