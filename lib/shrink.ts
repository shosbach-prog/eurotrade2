/** Foto im Browser verkleinern, bevor es hochgeladen wird (spart Ladezeit im Shop). Gibt bei Fehlern das Original zurück. */
export async function shrinkImage(f: File, max = 1400, quality = 0.85): Promise<File> {
  if (!/^image\/(png|jpe?g|webp)$/.test(f.type) || typeof createImageBitmap !== 'function') return f;
  try {
    const bmp = await createImageBitmap(f);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (s === 1 && f.size < 400_000) return f;
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const keepPng = f.type === 'image/png' && f.size < 200_000; // kleine Grafiken mit Transparenz unverändert lassen
    const type = keepPng ? 'image/png' : 'image/jpeg';
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, type, quality));
    if (!blob || blob.size >= f.size) return f;
    return new File([blob], f.name.replace(/\.(png|webp|jpe?g)$/i, type === 'image/png' ? '.png' : '.jpg'), { type });
  } catch { return f; }
}
