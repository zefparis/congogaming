import { createHmac, randomUUID } from 'crypto';

const BASE = 'https://api.unipesa.tech';

export function calculateSignature(data: Record<string, any>, secretKey: string): string {
  let stringForSignature = '';
  for (const [key, value] of Object.entries(data)) {
    if (key === 'signature') continue;
    if (value !== null && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        stringForSignature += `${key}.${k}${v}`;
      }
    } else {
      stringForSignature += `${key}${value}`;
    }
  }
  return createHmac('sha512', secretKey).update(stringForSignature).digest('hex').toLowerCase();
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export type UnipesaResponse = {
  status?: number;
  transaction_id?: string;
  message?: string;
  [k: string]: any;
};

async function call(path: string, payload: Record<string, any>): Promise<UnipesaResponse> {
  const publicId = env('UNIPESA_PUBLIC_ID');
  const url = `${BASE}/${publicId}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`Unipesa error ${res.status}: ${json?.message || text}`);
    (err as any).response = json;
    throw err;
  }
  return json;
}

export function newOrderId(): string {
  return randomUUID();
}

export async function paymentC2B(opts: {
  order_id: string;
  customer_id: string;
  amount: number;
  provider_id: number;
}): Promise<UnipesaResponse> {
  const merchant_id = env('UNIPESA_MERCHANT_ID');
  const callback_url = env('UNIPESA_CALLBACK_URL');
  const secret = env('UNIPESA_SECRET_KEY');
  const payload: Record<string, any> = {
    merchant_id,
    customer_id: opts.customer_id,
    order_id: opts.order_id,
    amount: opts.amount,
    currency: 'CDF',
    country: 'CD',
    callback_url,
    provider_id: opts.provider_id,
  };
  payload.signature = calculateSignature(payload, secret);
  return call('/payment_c2b', payload);
}

export async function paymentB2C(opts: {
  order_id: string;
  customer_id: string;
  amount: number;
  provider_id: number;
}): Promise<UnipesaResponse> {
  const merchant_id = env('UNIPESA_MERCHANT_ID');
  const callback_url = env('UNIPESA_CALLBACK_URL');
  const secret = env('UNIPESA_SECRET_KEY');
  const payload: Record<string, any> = {
    merchant_id,
    customer_id: opts.customer_id,
    order_id: opts.order_id,
    amount: opts.amount,
    currency: 'CDF',
    country: 'CD',
    callback_url,
    provider_id: opts.provider_id,
  };
  payload.signature = calculateSignature(payload, secret);
  return call('/payment_b2c', payload);
}

export async function paymentStatus(order_id: string): Promise<UnipesaResponse> {
  const merchant_id = env('UNIPESA_MERCHANT_ID');
  const secret = env('UNIPESA_SECRET_KEY');
  const payload: Record<string, any> = { merchant_id, order_id };
  payload.signature = calculateSignature(payload, secret);
  return call('/status', payload);
}

export function verifyCallbackSignature(body: Record<string, any>): boolean {
  const secret = env('UNIPESA_SECRET_KEY');
  const provided = String(body?.signature || '');
  if (!provided) return false;
  const expected = calculateSignature(body, secret);
  return provided.toLowerCase() === expected.toLowerCase();
}
