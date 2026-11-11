// Belegarten – auch im Browser nutzbar
export type InvKind = 'rechnung' | 'storno' | 'abschlag' | 'gutschrift';
/** Korrekturbeleg (Storno oder (Teil-)Gutschrift): Beträge mindern den Umsatz */
export const isCredit = (i: { kind: string }) => i.kind === 'storno' || i.kind === 'gutschrift';
export const sign = (i: { kind: string }) => (isCredit(i) ? -1 : 1);
export const kindName = (i: { kind: string; prepaid?: unknown[] | null }) =>
  i.kind === 'storno' ? 'Rechnungskorrektur (Storno)' : i.kind === 'gutschrift' ? 'Rechnungskorrektur (Gutschrift)' : i.kind === 'abschlag' ? 'Abschlagsrechnung' : i.prepaid?.length ? 'Schlussrechnung' : 'Rechnung';
export const kindShort = (i: { kind: string; prepaid?: unknown[] | null }) =>
  i.kind === 'storno' ? 'Storno' : i.kind === 'gutschrift' ? 'Gutschrift' : i.kind === 'abschlag' ? 'Abschlag' : i.prepaid?.length ? 'Schlussrechnung' : 'Rechnung';
