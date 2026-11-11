'use client';
import { useEffect, useState } from 'react';

/* Cookie-Einwilligung (DSGVO/TDDDG): Ablehnen so einfach wie Zustimmen, nichts vorausgewählt,
   optionale Dienste werden erst NACH Einwilligung geladen. Google Consent Mode v2 inklusive. */

type Choice = { stats: boolean; marketing: boolean };
type Saved = Choice & { v: number; date: string };
export type Tools = { ga?: string; gads?: string; meta?: string };
const KEY = 'et_consent';
const VERSION = 1;
const MAX_AGE_DAYS = 365;

function read(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as Saved | null;
    if (!s || s.v !== VERSION || Date.now() - Date.parse(s.date) > MAX_AGE_DAYS * 864e5) return null;
    return s;
  } catch { return null; }
}
const addScript = (src: string, id: string) => { if (document.getElementById(id)) return; const s = document.createElement('script'); s.async = true; s.src = src; s.id = id; document.head.appendChild(s); };

/** Dienste laden – nur was eingewilligt UND konfiguriert ist */
function apply(c: Choice, t: Tools) {
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); }; // eslint-disable-line prefer-rest-params
  w.gtag('consent', 'update', {
    analytics_storage: c.stats ? 'granted' : 'denied',
    ad_storage: c.marketing ? 'granted' : 'denied', ad_user_data: c.marketing ? 'granted' : 'denied', ad_personalization: c.marketing ? 'granted' : 'denied',
  });
  const gId = (c.stats && t.ga) || (c.marketing && t.gads);
  if (gId) {
    addScript(`https://www.googletagmanager.com/gtag/js?id=${gId}`, 'gtag-js');
    if (!w.__etGtagInit) { w.gtag('js', new Date()); w.__etGtagInit = true; }
    if (c.stats && t.ga) w.gtag('config', t.ga, { anonymize_ip: true });
    if (c.marketing && t.gads) w.gtag('config', t.gads);
  }
  if (c.marketing && t.meta && !w.fbq) {
    const f: any = (w.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); }); // eslint-disable-line prefer-rest-params
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = []; w._fbq = f;
    addScript('https://connect.facebook.net/en_US/fbevents.js', 'fb-px');
    w.fbq('init', t.meta); w.fbq('track', 'PageView');
  }
}

export function openConsent() { window.dispatchEvent(new Event('et-consent-open')); }

export default function Consent({ tools }: { tools: Tools }) {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);
  const [c, setC] = useState<Choice>({ stats: false, marketing: false });
  const hasStats = !!tools.ga, hasMarketing = !!(tools.gads || tools.meta);

  useEffect(() => {
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.gtag = w.gtag || function () { w.dataLayer.push(arguments); }; // eslint-disable-line prefer-rest-params
    w.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
    const s = read();
    if (s) { setC({ stats: s.stats, marketing: s.marketing }); apply(s, tools); } else setShow(true);
    const open = () => { const cur = read(); if (cur) setC({ stats: cur.stats, marketing: cur.marketing }); setDetails(true); setShow(true); };
    window.addEventListener('et-consent-open', open);
    return () => window.removeEventListener('et-consent-open', open);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function save(next: Choice) {
    const before = read();
    try { localStorage.setItem(KEY, JSON.stringify({ ...next, v: VERSION, date: new Date().toISOString() })); } catch {}
    setC(next); setShow(false); setDetails(false);
    // Widerruf: bereits geladene Skripte lassen sich nur durch Neuladen entfernen
    if (before && ((before.stats && !next.stats) || (before.marketing && !next.marketing))) window.location.reload();
    else apply(next, tools);
  }

  if (!show) return null;
  return (
    <div className="cc-wrap" role="dialog" aria-modal="false" aria-labelledby="cc-title">
      <div className="cc">
        <div className="cc-top">
          <span className="cc-icon" aria-hidden>🍪</span>
          <div>
            <h2 id="cc-title">Ihre Privatsphäre</h2>
            <p>Wir verwenden technisch notwendige Speicher, damit Anmeldung, Warenkorb und Merkliste funktionieren.
              {hasStats || hasMarketing ? ' Mit Ihrer Einwilligung nutzen wir zusätzlich Dienste für Statistik und Werbung, um unser Angebot zu verbessern. ' : ' Statistik- oder Werbe-Cookies setzen wir derzeit nicht ein. '}
              Ihre Auswahl können Sie jederzeit unter „Cookie-Einstellungen“ im Fußbereich ändern. Mehr in der <a href="/datenschutz#cookies">Datenschutzerklärung</a>.</p>
          </div>
        </div>

        {details && (
          <div className="cc-cats">
            <label className="cc-cat">
              <span><b>Notwendig</b><small>Anmeldung, Warenkorb, Merkliste, Ihre Cookie-Auswahl. Immer aktiv.</small></span>
              <span className="switch on cc-lock" aria-label="Immer aktiv"><i /></span>
            </label>
            <label className={`cc-cat ${!hasStats ? 'cc-off' : ''}`}>
              <span><b>Statistik</b><small>{hasStats ? 'Google Analytics 4 – anonyme Auswertung, welche Seiten genutzt werden.' : 'Derzeit nicht im Einsatz.'}</small></span>
              <button type="button" role="switch" aria-checked={c.stats} disabled={!hasStats} className={`switch ${c.stats ? 'on' : ''}`} onClick={() => setC({ ...c, stats: !c.stats })}><i /></button>
            </label>
            <label className={`cc-cat ${!hasMarketing ? 'cc-off' : ''}`}>
              <span><b>Marketing</b><small>{hasMarketing ? [tools.gads && 'Google Ads (Conversion-Messung)', tools.meta && 'Meta-Pixel (Facebook/Instagram)'].filter(Boolean).join(', ') + ' – misst den Erfolg unserer Anzeigen.' : 'Derzeit nicht im Einsatz.'}</small></span>
              <button type="button" role="switch" aria-checked={c.marketing} disabled={!hasMarketing} className={`switch ${c.marketing ? 'on' : ''}`} onClick={() => setC({ ...c, marketing: !c.marketing })}><i /></button>
            </label>
          </div>
        )}

        <div className="cc-actions">
          <button type="button" className="btn" onClick={() => save({ stats: false, marketing: false })}>Nur notwendige</button>
          {details
            ? <button type="button" className="btn alt" onClick={() => save(c)}>Auswahl speichern</button>
            : <button type="button" className="btn alt" onClick={() => setDetails(true)}>Einstellungen</button>}
          <button type="button" className="btn" onClick={() => save({ stats: hasStats, marketing: hasMarketing })}>Alle akzeptieren</button>
        </div>
        <p className="cc-links"><a href="/impressum">Impressum</a> · <a href="/datenschutz">Datenschutz</a></p>
      </div>
    </div>
  );
}

/** Link im Footer: Einstellungen erneut öffnen */
export function ConsentLink() {
  return <button type="button" className="ft-link-btn" onClick={openConsent}>Cookie-Einstellungen</button>;
}
