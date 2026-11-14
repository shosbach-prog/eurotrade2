import 'server-only';

/** PayPal Checkout (Orders API v2) ohne SDK – Zugangsdaten in .env:
 *  PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_MODE=sandbox|live (Standard: sandbox) */
const api = () => (process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');
export const paypalEnabled = () => !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);
export const paypalMode = () => (process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox');

let cached: { token: string; until: number } | null = null;
async function accessToken() {
  if (cached && cached.until > Date.now()) return cached.token;
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const r = await fetch(`${api()}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials', cache: 'no-store' });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) throw new Error(`PayPal-Anmeldung fehlgeschlagen (${r.status}) ${d.error_description ?? ''}`);
  cached = { token: d.access_token, until: Date.now() + Math.max(60, (d.expires_in ?? 3000) - 120) * 1000 };
  return cached.token;
}
async function call(path: string, body?: unknown, idem?: string) {
  const r = await fetch(`${api()}${path}`, {
    method: 'POST', cache: 'no-store',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(idem ? { 'PayPal-Request-Id': idem } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, d };
}

/** Bestellung bei PayPal anlegen – liefert Order-ID und Link zur Zahlungsseite */
export async function createPaypalOrder(o: { ref: string; description: string; amount: number; returnUrl: string; cancelUrl: string }) {
  const { ok, status, d } = await call('/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{ reference_id: o.ref.slice(0, 256), invoice_id: `${o.ref}-${Date.now().toString(36)}`.slice(0, 127), description: o.description.slice(0, 127), amount: { currency_code: 'EUR', value: o.amount.toFixed(2) } }],
    payment_source: { paypal: { experience_context: { brand_name: (process.env.SHOP_NAME ?? 'euro-trade.com').slice(0, 127), locale: 'de-DE', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW', return_url: o.returnUrl, cancel_url: o.cancelUrl } } },
  }, `create-${o.ref}-${Math.round(o.amount * 100)}-${Date.now()}`);
  if (!ok) throw new Error(`PayPal-Bestellung fehlgeschlagen (${status}): ${d?.details?.[0]?.description ?? d?.message ?? ''}`);
  const approve = (d.links ?? []).find((l: { rel: string; href: string }) => l.rel === 'payer-action' || l.rel === 'approve')?.href;
  if (!approve) throw new Error('PayPal lieferte keinen Zahlungslink.');
  return { id: String(d.id), approve: String(approve) };
}

/** Zahlung abschließen (nach Rückkehr von PayPal) – nur „COMPLETED“ mit passendem Betrag gilt als bezahlt */
export async function capturePaypalOrder(orderId: string) {
  if (!/^[A-Z0-9-]{5,40}$/i.test(orderId)) throw new Error('Ungültige PayPal-Bestellung.');
  const { ok, status, d } = await call(`/v2/checkout/orders/${orderId}/capture`, undefined, `capture-${orderId}`);
  // bereits abgeschlossen (z. B. Seite neu geladen) -> als Erfolg werten
  const already = !ok && d?.details?.some((x: { issue: string }) => x.issue === 'ORDER_ALREADY_CAPTURED');
  if (!ok && !already) throw new Error(`PayPal-Abschluss fehlgeschlagen (${status}): ${d?.details?.[0]?.issue ?? d?.message ?? ''}`);
  const cap = d?.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    completed: already || (d.status === 'COMPLETED' && cap?.status === 'COMPLETED'),
    amount: cap ? Number(cap.amount?.value) : null,
    captureId: cap?.id ? String(cap.id) : null,
    payer: d?.payer?.email_address ? String(d.payer.email_address) : null,
  };
}
