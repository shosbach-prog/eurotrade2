import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { fileCustomers, normEmail, saveCustomers, type Customer } from '@/lib/store';
import { parseTiers, tiersToString } from '@/lib/tiers';
import { esc, mailEnabled, sendMail, shopUrl } from '@/lib/mail';
import { button, h1, layout, p, signature } from '@/lib/mail-templates';

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const list: Customer[] = (Array.isArray(body?.customers) ? body.customers : []).slice(0, 2000).map((c: any) => ({
    code: String(c.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40),
    name: String(c.name ?? '').trim().slice(0, 120),
    markup: c.markup === '' || c.markup == null || !Number.isFinite(Number(c.markup)) ? null : Math.max(0, Math.min(500, Number(c.markup))),
    tiers: (() => { const t = String(c.tiers ?? '').trim(); return t === '-' ? '-' : t ? tiersToString(parseTiers(t)) || null : null; })(),
    skus: (Array.isArray(c.skus) ? c.skus : []).map((s: unknown) => String(s).trim().toUpperCase()).filter(Boolean).slice(0, 500),
    exclusive: !!c.exclusive,
    logoId: /^[a-f0-9]{24}$/.test(String(c.logoId ?? '')) ? String(c.logoId) : null,
    logoName: c.logoId ? String(c.logoName ?? '').slice(0, 120) : null,
    note: String(c.note ?? '').slice(0, 1000),
    active: c.active !== false,
    email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normEmail(c.email)) ? normEmail(c.email) : null,
    _orig: String(c._orig ?? c.code ?? '').toUpperCase(),
  }));
  const bad = list.find((c) => c.code.length < 4);
  if (bad) return NextResponse.json({ error: 'Jeder Code braucht mindestens 4 Zeichen (A–Z, 0–9, -).' }, { status: 400 });
  const dup = list.find((c, n) => list.findIndex((x) => x.code === c.code) !== n);
  if (dup) return NextResponse.json({ error: `Der Code ${dup.code} ist doppelt vergeben.` }, { status: 400 });
  const dupMail = list.find((c, n) => c.email && list.findIndex((x) => x.email === c.email) !== n);
  if (dupMail) return NextResponse.json({ error: `Die E-Mail ${dupMail.email} ist doppelt vergeben.` }, { status: 400 });
  // Passwort-Hash bleibt auf dem Server: über ursprünglichen Code zuordnen; neue E-Mail = Passwort zurücksetzen
  const old = fileCustomers();
  const activated: Customer[] = [];
  const next = list.map(({ _orig, ...c }: any) => {
    const prev = old.find((o) => o.code === _orig) ?? old.find((o) => o.code === c.code);
    const pw = prev?.pw && normEmail(prev.email) === c.email ? prev.pw : null;
    const pending = !!prev?.pending && !c.active;
    const out: Customer = { ...c, name: c.name || c.code, pw, pending, createdAt: prev?.createdAt };
    if (prev?.pending && c.active) activated.push(out);
    return out;
  });
  // Wartende Registrierungen werden separat (Freigabe-Box) verwaltet – nie beim Speichern der Liste verlieren
  const waiting = old.filter((o) => o.pending && o.active === false && !next.some((n) => n.code === o.code));
  saveCustomers([...waiting, ...next]);
  // Selbst registrierte Kunden: beim Freischalten automatisch benachrichtigen
  let mailed = 0;
  if (mailEnabled()) for (const c of activated) {
    if (!c.email) continue;
    try {
      await sendMail({ to: c.email, subject: `Ihr Konto bei ${process.env.SHOP_NAME ?? 'Euro-Trade'} ist freigeschaltet`,
        html: layout({ preheader: 'Sie können sich jetzt anmelden und bestellen.', title: 'Konto freigeschaltet',
          body: h1('Ihr Konto ist freigeschaltet') + p(`Guten Tag ${esc(c.name)},`)
            + p('Ihr Kundenkonto ist jetzt aktiv. Melden Sie sich mit Ihrer E-Mail-Adresse und Ihrem Passwort an – dann sehen Sie Ihre Preise, können Logos hochladen und direkt anfragen.')
            + button(`${shopUrl()}/zugang`, 'Jetzt anmelden') + signature() }) });
      mailed++;
    } catch (e) { console.error('Freischalt-Mail fehlgeschlagen', e); }
  }
  return NextResponse.json({ ok: true, activated: activated.length, mailed });
}
