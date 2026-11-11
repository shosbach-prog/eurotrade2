/** Lokales Produktbild als WebP (nur wenn serverseitig geprüft: p.webp) */
export const webp = (src: string | undefined, on?: boolean) => (on && src && src.startsWith('/p/') ? src.replace(/\.jpe?g$/i, '.webp') : src);
