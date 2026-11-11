/** CSV lesen/schreiben (Excel-kompatibel: Semikolon, UTF-8 mit BOM, Anführungszeichen) */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, '');
  const first = t.split('\n')[0] ?? '';
  const sep = (first.match(/;/g)?.length ?? 0) >= (first.match(/,/g)?.length ?? 0) ? (first.includes('\t') && !first.includes(';') ? '\t' : ';') : ',';
  const rows: string[][] = []; let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
export const toCsv = (rows: (string | number | null | undefined)[][]) => '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
