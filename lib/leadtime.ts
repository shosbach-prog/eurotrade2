// Lieferzeit-Rechner (Client + Server) – Werktage ohne Wochenenden und bundesweite Feiertage
const FIXED = ['01-01', '05-01', '10-03', '12-24', '12-25', '12-26', '12-31'];
function easter(y: number) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da); }
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function holidays(y: number) { const e = easter(y); const add = (n: number) => iso(new Date(y, e.getMonth(), e.getDate() + n)); return new Set([...FIXED.map((x) => `${y}-${x}`), add(-2), add(1), add(39), add(50), add(60)]); }
export const isWorkday = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6 && !holidays(d.getFullYear()).has(iso(d));
export function addWorkdays(from: Date, n: number) { const d = new Date(from.getFullYear(), from.getMonth(), from.getDate()); let k = 0; while (k < n) { d.setDate(d.getDate() + 1); if (isWorkday(d)) k++; } return d; }
export function subWorkdays(to: Date, n: number) { const d = new Date(to.getFullYear(), to.getMonth(), to.getDate()); let k = 0; while (k < n) { d.setDate(d.getDate() - 1); if (isWorkday(d)) k++; } return d; }

/** Ablauf: Angebot (1) → Annahme/Freigabe (Kunde) → Ware/Produktion → Versand */
export const LEAD = { offer: 1, approval: 2, plain: 3, deco: 10, ship: 2 };
export type LeadCheck = { earliest: Date; latestApproval: Date | null; state: 'ok' | 'knapp' | 'zu-spaet' | 'offen' };
export function leadCheck(wish: Date | null, hasDeco: boolean, now = new Date()): LeadCheck {
  const prod = hasDeco ? LEAD.deco : LEAD.plain;
  const earliest = addWorkdays(now, LEAD.offer + LEAD.approval + prod + LEAD.ship);
  if (!wish) return { earliest, latestApproval: null, state: 'offen' };
  const latestApproval = subWorkdays(wish, prod + LEAD.ship);
  const buffer = (wish.getTime() - earliest.getTime()) / 864e5;
  return { earliest, latestApproval, state: buffer >= 3 ? 'ok' : buffer >= 0 ? 'knapp' : 'zu-spaet' };
}
export const fmtDate = (d: Date) => d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
