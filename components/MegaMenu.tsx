'use client';
import { catPath, isCategoryUrl } from '@/lib/format';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Menu } from '@/lib/menu-defs';

const catHref = (slug: string, q?: string) => `${catPath(slug)}${q ? `?${q}` : ''}`;

/** Mega-Menü: Hauptgruppen → Kategorien → Artikeltypen, dazu Damen/Herren/Kinder, Marken & Branchen */
export default function MegaMenu({ menu }: { menu: Menu }) {
  const path = usePathname() ?? '/';
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const hover = useRef(false);
  useEffect(() => { hover.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches; }, []);
  useEffect(() => { setOpen(null); }, [path]);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(null); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('pointerdown', down); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
  }, [open]);
  const enter = (k: string) => { if (!hover.current) return; clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(k), open ? 60 : 160); };
  const leave = () => { if (!hover.current) return; clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(null), 220); };
  const close = () => setOpen(null);
  const activeCat = isCategoryUrl(path) ? path.split('/').filter(Boolean).pop()!.replace(/-(damen|herren|kinder)$/, '') : null;

  const tabs: { key: string; label: string; on: boolean }[] = [
    ...menu.groups.map((g) => ({ key: g.key, label: g.label, on: !!activeCat && g.cats.some((c) => c.slug === activeCat) })),
    ...(menu.genders.length ? [{ key: 'wer', label: 'Damen · Herren · Kinder', on: false }] : []),
    { key: 'mehr', label: 'Marken', on: path.startsWith('/marken') || path.startsWith('/fuer/') || path.startsWith('/aktion/') },
  ];

  const panel = (k: string) => {
    const g = menu.groups.find((x) => x.key === k);
    if (g) return (
      <div className="mm-cols">
        {g.cats.map((c) => (
          <div key={c.slug} className="mm-col">
            <Link href={catHref(c.slug)} className="mm-h" onClick={close}>{c.name} <span>{c.count}</span></Link>
            <ul>
              {c.subs.map((s) => <li key={s.key}><Link href={catHref(s.key)} onClick={close}>{s.label} <span>{s.count}</span></Link></li>)}
              <li><Link href={catHref(c.slug)} className="mm-all" onClick={close}>Alle {c.name} →</Link></li>
            </ul>
            <div className="mm-for">
              {(['Damen', 'Herren', 'Kinder'] as const).filter((x) => c.g[x]).map((x) => <Link key={x} href={catHref(`${c.slug}-${x.toLowerCase()}`)} onClick={close}>{x}</Link>)}
            </div>
          </div>
        ))}
        <MegaPromo deals={menu.deals} close={close} />
      </div>
    );
    if (k === 'wer') return (
      <div className="mm-cols">
        {menu.genders.map((ge) => (
          <div key={ge.label} className="mm-col">
            <span className="mm-h">{ge.label}{ge.label !== 'Kinder' && <small>inkl. Unisex</small>}</span>
            <ul>{ge.cats.map((c) => <li key={c.slug}><Link href={catHref(`${c.slug}-${ge.label.toLowerCase()}`)} onClick={close}>{c.name} <span>{c.count}</span></Link></li>)}</ul>
          </div>
        ))}
        <MegaPromo deals={menu.deals} close={close} />
      </div>
    );
    return (
      <div className="mm-cols">
        <div className="mm-col">
          <Link href="/marken" className="mm-h" onClick={close}>Top-Marken</Link>
          <ul>
            {menu.brands.map((b) => <li key={b.slug}><Link href={`/marken/${b.slug}`} onClick={close}>{b.name} <span>{b.count}</span></Link></li>)}
            <li><Link href="/marken" className="mm-all" onClick={close}>Alle Marken →</Link></li>
          </ul>
        </div>
        <div className="mm-col">
          <span className="mm-h">Für Branchen & Anlässe</span>
          <ul>{menu.branchen.map((b) => <li key={b.href}><Link href={b.href} onClick={close}>{b.label}</Link></li>)}</ul>
        </div>
        <div className="mm-col">
          <span className="mm-h">Service</span>
          <ul>
            <li><Link href="/druck-stick" onClick={close}>Druck & Stick erklärt</Link></li>
            <li><Link href="/ratgeber" onClick={close}>Ratgeber</Link></li>
            <li><Link href="/produktsicherheit" onClick={close}>Produktsicherheit (GPSR)</Link></li>
            <li><Link href="/kontakt" onClick={close}>Kontakt</Link></li>
          </ul>
        </div>
        <MegaPromo deals={menu.deals} close={close} />
      </div>
    );
  };

  return (
    <nav className="catnav mm" ref={ref} aria-label="Sortiment" onMouseLeave={leave}>
      <div className="wrap mm-bar">
        {tabs.map((t) => (
          <button key={t.key} type="button" className={`mm-tab ${open === t.key ? 'open' : ''} ${t.on ? 'on' : ''}`} aria-expanded={open === t.key}
            onMouseEnter={() => enter(t.key)} onClick={() => setOpen(open === t.key ? null : t.key)}>
            {t.label}<span className="mm-car" aria-hidden>▾</span>
          </button>
        ))}
        {menu.deals > 0 && <Link href={catHref('sonderangebote')} className={`mm-tab deal ${path === catHref('sonderangebote') ? 'on' : ''}`} onMouseEnter={leave}>Sonderangebote</Link>}
      </div>
      {open && <div className="mm-panel" onMouseEnter={() => clearTimeout(timer.current)}><div className="wrap">{panel(open)}</div></div>}
    </nav>
  );
}

function MegaPromo({ deals, close }: { deals: number; close: () => void }) {
  return (
    <div className="mm-promo">
      <b>Mit Ihrem Logo – ab 1 Stück</b>
      <p>Bedruckt oder bestickt, Staffelpreise ab 10 Stück.</p>
      {deals > 0 && <Link href={catHref('sonderangebote')} className="mm-deal" onClick={close}>Sonderangebote ansehen ({deals}) →</Link>}
      <a href="tel:+493040719258" className="mm-tel">Produktberatung: 030 40719258</a>
    </div>
  );
}
