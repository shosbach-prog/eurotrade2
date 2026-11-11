import 'server-only';
import { invoiceTotals, dueDate, type Invoice, type InvoiceSettings } from './invoice';

// E-Rechnung im Format XRechnung 3.0 (CII-Syntax, EN 16931) – Pflicht im B2B-Bereich, für Behörden schon lange
const x = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
const a = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const d = (iso: string | Date) => (typeof iso === 'string' ? iso.slice(0, 10) : iso.toISOString().slice(0, 10)).replace(/-/g, '');
const unit = (u: string) => ({ stk: 'H87', 'stück': 'H87', std: 'HUR', h: 'HUR', pausch: 'LS', pauschal: 'LS', m: 'MTR', set: 'SET' } as Record<string, string>)[u.toLowerCase()] ?? 'C62';
const addr = (zip: string, street: string, city: string, country: string) => `<ram:PostalTradeAddress>${zip ? `<ram:PostcodeCode>${x(zip)}</ram:PostcodeCode>` : ''}${street ? `<ram:LineOne>${x(street)}</ram:LineOne>` : ''}${city ? `<ram:CityName>${x(city)}</ram:CityName>` : ''}<ram:CountryID>${x(country || 'DE')}</ram:CountryID></ram:PostalTradeAddress>`;

export function xrechnung(inv: Invoice, s: InvoiceSettings): string {
  const t = invoiceTotals(inv);
  const klein = inv.kleinunternehmer;
  const cat = klein ? 'E' : t.rate > 0 ? 'S' : 'Z';
  const tax = (tag: string) => `<ram:${tag}><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>${cat}</ram:CategoryCode><ram:RateApplicablePercent>${t.rate}</ram:RateApplicablePercent></ram:${tag}>`;
  // Positionen mit negativem Preis (Rabatte) werden zu Nachlässen auf Belegebene, Versand zu einer Position
  const pos = inv.lines.filter((l) => l.qty * l.price >= 0 && l.qty > 0);
  if (inv.shipping > 0) pos.push({ text: 'Versand', qty: 1, unit: 'Pausch', price: inv.shipping });
  const allow = inv.lines.filter((l) => l.qty * l.price < 0);
  const lineTotal = pos.reduce((s2, l) => s2 + Math.round(l.qty * l.price * 100) / 100, 0);
  const allowTotal = allow.reduce((s2, l) => s2 + Math.abs(Math.round(l.qty * l.price * 100) / 100), 0);
  const due = dueDate(inv);
  const lines = pos.map((l, k) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>${k + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>${x(l.text)}</ram:Name>${l.detail ? `<ram:Description>${x(l.detail)}</ram:Description>` : ''}</ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>${a(l.price)}</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="${unit(l.unit)}">${l.qty}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>${tax('ApplicableTradeTax')}<ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${a(l.qty * l.price)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('');
  const b = inv.buyer;
  const note = [inv.note, klein ? 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.' : ''].filter(Boolean).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${x(inv.no)}</ram:ID>
    <ram:TypeCode>${inv.kind === 'storno' ? 381 : 380}</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${d(inv.date)}</udt:DateTimeString></ram:IssueDateTime>${note ? `
    <ram:IncludedNote><ram:Content>${x(note)}</ram:Content></ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${lines}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>${x(b.reference || inv.inquiryNo || inv.no)}</ram:BuyerReference>
      <ram:SellerTradeParty>${!s.vatId ? `
        <ram:ID>${x(s.taxNo || s.email)}</ram:ID>` : ''}
        <ram:Name>${x(s.company)}</ram:Name>
        <ram:DefinedTradeContact><ram:PersonName>${x(s.owner || s.company)}</ram:PersonName><ram:TelephoneUniversalCommunication><ram:CompleteNumber>${x(s.phone)}</ram:CompleteNumber></ram:TelephoneUniversalCommunication><ram:EmailURIUniversalCommunication><ram:URIID>${x(s.email)}</ram:URIID></ram:EmailURIUniversalCommunication></ram:DefinedTradeContact>
        ${addr(s.zip, s.street, s.city, s.country)}
        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">${x(s.email)}</ram:URIID></ram:URIUniversalCommunication>${s.vatId ? `
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${x(s.vatId.replace(/\s/g, ''))}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}${s.taxNo ? `
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${x(s.taxNo)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${x(b.company || b.name)}</ram:Name>${b.company && b.name ? `
        <ram:DefinedTradeContact><ram:PersonName>${x(b.name)}</ram:PersonName></ram:DefinedTradeContact>` : ''}
        ${addr(b.zip, b.street, b.city, b.country)}
        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">${x(b.email)}</ram:URIID></ram:URIUniversalCommunication>${b.vatId ? `
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${x(b.vatId.replace(/\s/g, ''))}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">${d(inv.serviceDate || inv.date)}</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${x(inv.no)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>${s.iban ? `
      <ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>58</ram:TypeCode><ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${x(s.iban.replace(/\s/g, ''))}</ram:IBANID><ram:AccountName>${x(s.owner || s.company)}</ram:AccountName></ram:PayeePartyCreditorFinancialAccount>${s.bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>${x(s.bic.replace(/\s/g, ''))}</ram:BICID></ram:PayeeSpecifiedCreditorFinancialInstitution>` : ''}</ram:SpecifiedTradeSettlementPaymentMeans>` : ''}
      <ram:ApplicableTradeTax><ram:CalculatedAmount>${a(t.vat)}</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode>${klein ? '<ram:ExemptionReason>Kleinunternehmer gemäß § 19 UStG</ram:ExemptionReason>' : ''}<ram:BasisAmount>${a(t.net)}</ram:BasisAmount><ram:CategoryCode>${cat}</ram:CategoryCode>${klein ? '<ram:ExemptionReasonCode>VATEX-EU-O</ram:ExemptionReasonCode>' : ''}<ram:RateApplicablePercent>${t.rate}</ram:RateApplicablePercent></ram:ApplicableTradeTax>${allow.map((l) => `
      <ram:SpecifiedTradeAllowanceCharge><ram:ChargeIndicator><udt:Indicator>false</udt:Indicator></ram:ChargeIndicator><ram:ActualAmount>${a(Math.abs(l.qty * l.price))}</ram:ActualAmount><ram:Reason>${x([l.text, l.detail].filter(Boolean).join(' – '))}</ram:Reason>${tax('CategoryTradeTax')}</ram:SpecifiedTradeAllowanceCharge>`).join('')}
      <ram:SpecifiedTradePaymentTerms><ram:Description>${x(inv.kind === 'storno' ? 'Gutschrift – Betrag wird erstattet bzw. verrechnet.' : `Zahlbar ohne Abzug bis ${due.toLocaleDateString('de-DE')}.`)}</ram:Description>${inv.kind === 'storno' ? '' : `<ram:DueDateDateTime><udt:DateTimeString format="102">${d(due)}</udt:DateTimeString></ram:DueDateDateTime>`}</ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${a(lineTotal)}</ram:LineTotalAmount>
        <ram:ChargeTotalAmount>0.00</ram:ChargeTotalAmount>
        <ram:AllowanceTotalAmount>${a(allowTotal)}</ram:AllowanceTotalAmount>
        <ram:TaxBasisTotalAmount>${a(t.net)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${a(t.vat)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${a(t.gross)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${a(t.gross)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>${inv.refNo ? `
      <ram:InvoiceReferencedDocument><ram:IssuerAssignedID>${x(inv.refNo)}</ram:IssuerAssignedID></ram:InvoiceReferencedDocument>` : ''}
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}
