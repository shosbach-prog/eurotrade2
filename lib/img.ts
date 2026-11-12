/** Lokales Produktbild als WebP (nur wenn serverseitig geprüft: p.webp) */
/** Kleine Fassung (480 px) für Kacheln und Vorschaubilder – nur wenn serverseitig geprüft: p.mid */
export const mid = (src: string | undefined, on?: boolean, w?: boolean) => (on && src && src.startsWith('/p/') ? src.replace(/\.(jpe?g|webp)$/i, '.m.webp') : webp(src, w));
export const webp = (src: string | undefined, on?: boolean) => (on && src && src.startsWith('/p/') ? src.replace(/\.jpe?g$/i, '.webp') : src);
