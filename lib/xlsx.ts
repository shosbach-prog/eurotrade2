import 'server-only';
import zlib from 'node:zlib';

/** Minimaler Excel-Leser (.xlsx): erste Tabelle als Zeilen mit Text-Zellen – ohne Zusatzpakete */
function unzip(buf: Buffer): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  // Ende des zentralen Verzeichnisses suchen
  let e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('Keine gültige Excel-Datei (.xlsx).');
  const n = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16);
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nl).toString('utf8');
    const lnl = buf.readUInt16LE(off + 26), lxl = buf.readUInt16LE(off + 28);
    const data = buf.subarray(off + 30 + lnl + lxl, off + 30 + lnl + lxl + csize);
    out.set(name, method === 8 ? zlib.inflateRawSync(data) : Buffer.from(data));
    p += 46 + nl + xl + cl;
  }
  return out;
}
const ent = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, '&');
const colIdx = (ref: string) => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };

export function readXlsx(buf: Buffer): string[][] {
  const z = unzip(buf);
  const ss: string[] = [];
  const sx = z.get('xl/sharedStrings.xml')?.toString('utf8');
  if (sx) for (const m of sx.matchAll(/<si>([\s\S]*?)<\/si>/g)) ss.push(ent([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  const sheet = [...z.keys()].filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))[0];
  if (!sheet) throw new Error('Keine Tabelle in der Excel-Datei gefunden.');
  const xml = z.get(sheet)!.toString('utf8');
  const rows: string[][] = [];
  for (const r of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const c of r[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1], body = c[2] ?? '';
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1]; const t = /t="(\w+)"/.exec(attrs)?.[1];
      let v = '';
      if (t === 'inlineStr') v = ent([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join(''));
      else { const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? ''; v = t === 's' ? ss[Number(raw)] ?? '' : ent(raw); }
      row[ref ? colIdx(ref) : row.length] = v;
    }
    rows.push(Array.from(row, (x) => x ?? ''));
  }
  return rows;
}
/** Excel-Seriennummer (z. B. 46387) → JJJJ-MM-TT */
export const excelDate = (v: string): string | null => {
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const n = Number(v); if (!v || !Number.isFinite(n) || n < 20000 || n > 80000) return null;
  return new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 864e5).toISOString().slice(0, 10);
};
