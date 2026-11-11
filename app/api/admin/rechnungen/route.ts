import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/customer';
import { getInquiry } from '@/lib/store';
import { getInvoice, invHistory, newInvoice, saveInvoice, saveInvoiceSettings, type Invoice, type InvoiceSettings } from '@/lib/invoice';
import { finalizeInvoice, sendInvoice, stornoInvoice } from '@/lib/invoice-actions';

const str = (v: unknown, n = 200) => String(v ?? '').replace(/\r/g, '').trim().slice(0, n);
const num = (v: unknown) => { const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; };
const day = (v: unknown, fb: string) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : fb);

function cleanDraft(i: Invoice, d: any): Invoice {
  const b = d?.buyer ?? {};
  return {
    ...i,
    date: day(d.date, i.date), serviceDate: day(d.serviceDate, i.serviceDate), payDays: Math.max(0, Math.min(120, Math.floor(num(d.payDays ?? i.payDays)))),
    buyer: { company: str(b.company, 120), name: str(b.name, 120), street: str(b.street, 120), zip: str(b.zip, 12), city: str(b.city, 80), country: (str(b.country, 2) || 'DE').toUpperCase(), email: str(b.email, 160), vatId: str(b.vatId, 20), reference: str(b.reference, 80) },
    lines: (Array.isArray(d.lines) ? d.lines : []).slice(0, 300).map((l: any) => ({ text: str(l.text, 300), detail: str(l.detail, 400), qty: num(l.qty), unit: str(l.unit, 10) || 'Stk', price: num(l.price) })).filter((l: any) => l.text || l.price),
    shipping: Math.max(0, num(d.shipping)), vat: Math.max(0, Math.min(30, num(d.vat))), kleinunternehmer: !!d.kleinunternehmer, note: str(d.note, 3000),
  };
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const d = await req.json().catch(() => ({}));
  try {
    if (d.action === 'settings') {
      const s = d.settings ?? {};
      const p: Partial<InvoiceSettings> = { company: str(s.company, 120), owner: str(s.owner, 120), street: str(s.street, 120), zip: str(s.zip, 12), city: str(s.city, 80), country: (str(s.country, 2) || 'DE').toUpperCase(), phone: str(s.phone, 40), email: str(s.email, 160), web: str(s.web, 120), taxNo: str(s.taxNo, 40), vatId: str(s.vatId, 20), iban: str(s.iban, 40).toUpperCase(), bic: str(s.bic, 15).toUpperCase(), bank: str(s.bank, 80), payDays: Math.max(0, Math.min(120, Math.floor(num(s.payDays)))), prefix: str(s.prefix, 10) || 'RE-', kleinunternehmer: !!s.kleinunternehmer, reminderDays: Math.max(0, Math.min(60, Math.floor(num(s.reminderDays)))), footer: str(s.footer, 160) };
      if (p.iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(p.iban.replace(/\s/g, ''))) return NextResponse.json({ error: 'Die IBAN sieht nicht gültig aus.' }, { status: 400 });
      saveInvoiceSettings(p);
      return NextResponse.json({ ok: true, message: 'Einstellungen gespeichert.' });
    }
    if (d.action === 'new') {
      const q = d.inquiryNo ? getInquiry(String(d.inquiryNo)) : null;
      const i = newInvoice(q);
      saveInvoice(i);
      return NextResponse.json({ ok: true, id: i.id });
    }
    const i = getInvoice(String(d.id ?? ''));
    if (!i) return NextResponse.json({ error: 'Rechnung nicht gefunden.' }, { status: 404 });
    if (d.action === 'save' || d.action === 'finalize' || d.action === 'finalize-send') {
      if (i.no) return NextResponse.json({ error: 'Festgeschriebene Rechnungen können nicht mehr geändert werden – bitte stornieren.' }, { status: 400 });
      const n = cleanDraft(i, d.invoice ?? {});
      saveInvoice(n);
      if (d.action === 'save') return NextResponse.json({ ok: true, message: 'Entwurf gespeichert.', invoice: n });
      await finalizeInvoice(n);
      if (d.action === 'finalize-send') await sendInvoice(n);
      return NextResponse.json({ ok: true, message: `Rechnung ${n.no} festgeschrieben${d.action === 'finalize-send' ? ` und an ${n.buyer.email} gesendet` : ''}.`, invoice: n });
    }
    if (d.action === 'send') { await sendInvoice(i); return NextResponse.json({ ok: true, message: `An ${i.buyer.email} gesendet.`, invoice: i }); }
    if (d.action === 'remind') { await sendInvoice(i, 'erinnerung'); return NextResponse.json({ ok: true, message: 'Zahlungserinnerung gesendet.', invoice: i }); }
    if (d.action === 'paid') {
      if (!i.no || i.status === 'storniert') return NextResponse.json({ error: 'Nicht möglich.' }, { status: 400 });
      if (d.undo) { i.status = 'offen'; i.paidAt = null; i.paidAmount = null; invHistory(i, 'Zahlung zurückgesetzt'); }
      else { i.status = 'bezahlt'; i.paidAt = day(d.date, new Date().toISOString().slice(0, 10)); i.paidAmount = d.amount != null ? num(d.amount) : null; invHistory(i, `Als bezahlt markiert (${i.paidAt})`); }
      saveInvoice(i);
      return NextResponse.json({ ok: true, message: d.undo ? 'Wieder offen.' : 'Als bezahlt markiert.', invoice: i });
    }
    if (d.action === 'storno') { const s = await stornoInvoice(i); if (d.send) await sendInvoice(s).catch(() => null); return NextResponse.json({ ok: true, message: `Storniert durch ${s.no}.`, id: s.id }); }
    if (d.action === 'delete') {
      if (i.no) return NextResponse.json({ error: 'Festgeschriebene Rechnungen werden nie gelöscht (Aufbewahrungspflicht) – bitte stornieren.' }, { status: 400 });
      const fs = await import('node:fs'); const path = await import('node:path');
      fs.rmSync(path.join(process.cwd(), 'data', 'rechnungen', `${i.id}.json`), { force: true });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 400 });
  }
}
