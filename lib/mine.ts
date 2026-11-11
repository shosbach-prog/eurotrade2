// „Meine Anfragen“ – pro Gerät/Browser gemerkt (Codes werden oft von mehreren Personen geteilt)
const KEY = 'et-mine-v1';
export type Mine = { no: string; token: string };
export function myInquiries(): Mine[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
export function saveMyInquiry(no: string, token: string) {
  try { localStorage.setItem(KEY, JSON.stringify([{ no, token }, ...myInquiries().filter((x) => x.no !== no)].slice(0, 50))); } catch {}
}
