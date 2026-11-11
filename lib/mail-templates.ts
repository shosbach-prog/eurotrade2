import 'server-only';
import { esc, shopUrl } from './mail';

// E-Mail-Layout: tabellenbasiert mit Inline-Styles – funktioniert in Outlook, Gmail, Apple Mail & Co.
const C = { brand: '#0a5cf0', dark: '#0638b8', accent: '#ffc21a', ink: '#14181f', muted: '#5d6675', line: '#e3e6eb', bg: '#f2f4f7', ok: '#1d7a3e' };
const F = "font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const shop = () => process.env.SHOP_NAME ?? 'Euro-Trade';
const sender = () => (process.env.OFFER_SENDER ?? 'Euro-Trade · Sebastian Hosbach|Seehang 28 · 44263 Dortmund|Tel. 030 40719258 · info@euro-trade.com').split('|');

export const eur = (n: number | null | undefined) => (n == null ? 'auf Anfrage' : n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }));

/** Rahmen: Kopf mit Logo, Inhalt, Fußzeile mit Kontakt/Impressum */
export function layout(opts: { preheader: string; title: string; body: string; footerNote?: string }) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};${F};color:${C.ink};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}&#8203;&#847;&#8203;&#847;&#8203;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">
    <tr><td style="background:${C.brand};background-image:linear-gradient(100deg,#0646c9 0%,#0a5cf0 55%,#1a8bff 100%);border-radius:14px 14px 0 0;padding:22px 28px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="background:${C.accent};background-image:linear-gradient(135deg,#ffe45c,#ffb300);border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;${F};font-size:23px;font-weight:900;color:${C.dark}">E</td>
        <td style="padding-left:12px;${F}"><div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.5px;line-height:1">euro<span style="color:${C.accent}">-trade</span><span style="font-size:14px;font-weight:700;color:#cfe0ff">.com</span></div>
          <div style="font-size:10px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:#cfe0ff;margin-top:5px">Textil · Werbemittel · Veredelung</div></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#ffffff;padding:32px 28px 28px;${F};font-size:15px;line-height:1.6;color:${C.ink}">
      ${opts.body}
    </td></tr>
    <tr><td style="background:#ffffff;border-top:1px solid ${C.line};border-radius:0 0 14px 14px;padding:18px 28px 22px;${F};font-size:12px;line-height:1.6;color:${C.muted}">
      ${opts.footerNote ? `<p style="margin:0 0 10px">${opts.footerNote}</p>` : ''}
      ${sender().map(esc).join('<br>')}<br>
      <a href="${shopUrl()}" style="color:${C.brand};text-decoration:none">${esc(shopUrl().replace(/^https?:\/\//, ''))}</a> · <a href="${shopUrl()}/widerruf" style="color:${C.muted}">Rückgabe & Widerruf</a> · <a href="${shopUrl()}/impressum" style="color:${C.muted}">Impressum</a> · <a href="${shopUrl()}/datenschutz" style="color:${C.muted}">Datenschutz</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

export const h1 = (t: string) => `<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:${C.ink};${F}">${t}</h1>`;
export const p = (t: string, muted = false) => `<p style="margin:0 0 14px;${muted ? `color:${C.muted};font-size:14px` : ''}">${t}</p>`;
export const button = (href: string, label: string, color = C.brand) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0"><tr><td style="background:${color};border-radius:8px"><a href="${href}" style="display:inline-block;padding:13px 26px;${F};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px">${label}</a></td></tr></table>`;
/** hervorgehobene Box (z. B. Nummer, Summe) */
export const infoBox = (rows: [string, string][], accent = C.brand) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;background:#f5f8fc;border-left:4px solid ${accent};border-radius:8px"><tr><td style="padding:14px 18px;${F};font-size:14px">
  ${rows.map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="color:${C.muted};padding:3px 0">${k}</td><td align="right" style="font-weight:700;padding:3px 0">${v}</td></tr></table>`).join('')}
  </td></tr></table>`;

export type MailLine = { sku: string; name: string; color?: string; size?: string; qty: number; price: number | null; sum: number; deco?: string; note?: string; image?: string };
/** Artikeltabelle mit optionalem Bild, Veredelung und Summen */
export function itemsTable(lines: MailLine[], totals: [string, string, boolean?][]) {
  const rows = lines.map((l) => `<tr>
    ${l.image !== undefined ? `<td width="56" style="padding:12px 10px 12px 0;border-bottom:1px solid ${C.line};vertical-align:top">${l.image ? `<img src="${esc(l.image)}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid ${C.line}">` : ''}</td>` : ''}
    <td style="padding:12px 8px 12px 0;border-bottom:1px solid ${C.line};vertical-align:top;${F};font-size:14px">
      <div style="font-weight:700">${esc(l.name)}</div>
      <div style="color:${C.muted};font-size:12px">${[l.sku, l.color, l.size].filter(Boolean).map(esc).join(' · ')}</div>
      ${l.deco ? `<div style="color:${C.brand};font-size:12px;margin-top:3px">✦ ${esc(l.deco)}</div>` : ''}
      ${l.note ? `<div style="color:${C.muted};font-size:12px;font-style:italic">„${esc(l.note)}“</div>` : ''}
    </td>
    <td align="right" style="padding:12px 0 12px 8px;border-bottom:1px solid ${C.line};vertical-align:top;white-space:nowrap;${F};font-size:14px">${l.qty} × ${eur(l.price)}<div style="font-weight:700">${l.price == null ? '' : eur(l.sum)}</div></td>
  </tr>`).join('');
  const tot = totals.map(([k, v, big]) => `<tr><td ${lines[0]?.image !== undefined ? 'colspan="2"' : ''} align="right" style="padding:${big ? '10px' : '4px'} 12px 0 0;${F};font-size:${big ? 16 : 14}px;${big ? 'font-weight:800' : `color:${C.muted}`}">${k}</td><td align="right" style="padding:${big ? '10px' : '4px'} 0 0;white-space:nowrap;${F};font-size:${big ? 16 : 14}px;font-weight:${big ? 800 : 600}">${v}</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;border-top:2px solid ${C.ink}">${rows}${tot}</table>`;
}
/** Kontaktdaten des Kunden (für Mails an den Shop) */
export function contactBlock(c: Record<string, string>, extra: [string, string][] = []) {
  const rows: [string, string][] = [
    ['Name', esc(c.name)], ...(c.company ? [['Firma / Verein', esc(c.company)] as [string, string]] : []),
    ['E-Mail', `<a href="mailto:${esc(c.email)}" style="color:${C.brand}">${esc(c.email)}</a>`],
    ...(c.phone ? [['Telefon', `<a href="tel:${esc(c.phone)}" style="color:${C.brand}">${esc(c.phone)}</a>`] as [string, string]] : []),
    ...(c.city ? [['Ort', esc(c.city)] as [string, string]] : []), ...extra,
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1px solid ${C.line};border-radius:8px"><tr><td style="padding:12px 16px">${rows.map(([k, v]) => `<div style="${F};font-size:14px;padding:2px 0"><span style="color:${C.muted};display:inline-block;min-width:120px">${k}</span> ${v}</div>`).join('')}</td></tr></table>`;
}
export const quote = (t: string) => `<div style="margin:0 0 18px;padding:12px 16px;background:#f6f7f9;border-radius:8px;${F};font-size:14px;white-space:pre-wrap">${esc(t)}</div>`;
export const signature = () => p(`Mit freundlichen Grüßen<br><strong>${esc(sender()[0])}</strong>`);
/** Text-Version (für Mailprogramme ohne HTML und bessere Zustellbarkeit) */
export const toText = (html: string) => html.replace(/<style[\s\S]*?<\/style>|<title[\s\S]*?<\/title>/g, '').replace(/<div style="display:none[\s\S]*?<\/div>/, '').replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|tr|h1|div|table)>/g, '\n').replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, '$2 ($1)').replace(/<[^>]+>/g, '').replace(/&#8203;|&#847;/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim();

/** Angebotspositionen als Mail-Tabelle */
export function offerTable(o: { lines: { text: string; detail?: string; qty: number; price: number }[]; shipping: number; vat: number }, t: { net: number; vat: number; gross: number }) {
  return itemsTable(
    o.lines.map((l) => ({ sku: '', name: l.text, color: l.detail, qty: l.qty, price: l.price, sum: Math.round(l.qty * l.price * 100) / 100 })),
    [...(o.shipping ? [['Versand', eur(o.shipping)] as [string, string]] : []), ['Summe netto', eur(t.net)], [`zzgl. ${o.vat} % MwSt.`, eur(t.vat)], ['Gesamtbetrag', eur(t.gross), true]],
  );
}
