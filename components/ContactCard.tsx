import { getContactPerson, type ContactPerson } from '@/lib/store';

/** Gepflegter Ansprechpartner oder Standard (Inhaber) */
export const contactPerson = (): ContactPerson => getContactPerson() ?? { name: 'Sebastian Hosbach', role: 'Ihr Produktberater', phone: process.env.BERATUNG_TELEFON ?? '030 40719258', email: process.env.CONTACT_EMAIL ?? 'info@euro-trade.com', text: 'Fragen zu Größen, Veredelung oder Mengen? Ich helfe Ihnen gern persönlich weiter.', photoId: null };

/** Persönlicher Ansprechpartner mit Foto (Admin → Referenzen) */
export default function ContactCard({ compact }: { compact?: boolean }) {
  const c = contactPerson();
  const ini = c.name.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  const tel = c.phone.replace(/[^\d+]/g, '').replace(/^0/, '+49');
  return (
    <aside className={`cp ${compact ? 'compact' : ''}`} aria-label="Ihr Ansprechpartner">
      {c.photoId ? <img src={`/api/bild/${c.photoId}`} alt={`Foto ${c.name}`} width={64} height={64} loading="lazy" /> : <span className="cp-ini" aria-hidden>{ini}</span>}
      <div>
        <small className="muted">{c.role || 'Ihr Ansprechpartner'}</small>
        <b>{c.name}</b>
        {c.text && !compact && <p>{c.text}</p>}
        <div className="cp-links">
          {c.phone && <a href={`tel:${tel}`}>📞 {c.phone}</a>}
          {c.email && <a href={`mailto:${c.email}`}>✉ {c.email}</a>}
        </div>
        {c.hours && <small className="muted">{c.hours}</small>}
      </div>
    </aside>
  );
}
