// Zugangscodes – funktioniert in Middleware (Edge) und im Node-Server (Web Crypto)
// .env:  ACCESS_CODES=FIRMA24:Firma Muster GmbH,TEAM-XY:Verein XY   (Name nach dem Doppelpunkt ist optional)
//        ACCESS_SECRET=<langer Zufallswert>   – ändern = alle Freischaltungen ungültig
export const ACCESS_COOKIE = 'et_access';
export const ACCESS_DAYS = 180;

export type AccessCode = { code: string; label: string };

export function accessCodes(): AccessCode[] {
  return (process.env.ACCESS_CODES ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const [code, ...rest] = x.split(':');
      return { code: code.trim().toUpperCase(), label: rest.join(':').trim() };
    })
    .filter((c) => c.code);
}

/** Shop ist nur gesperrt, wenn mindestens ein Code hinterlegt ist */
export const accessEnabled = () => accessCodes().length > 0;

export async function tokenFor(code: string): Promise<string> {
  const data = new TextEncoder().encode(`${process.env.ACCESS_SECRET ?? 'euro-trade'}|${code.trim().toUpperCase()}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Liefert den freigeschalteten Code zum Cookie-Wert – oder null (Code entfernt / ungültig) */
export async function codeForToken(token?: string | null): Promise<AccessCode | null> {
  if (!token) return null;
  for (const c of accessCodes()) if ((await tokenFor(c.code)) === token) return c;
  return null;
}
