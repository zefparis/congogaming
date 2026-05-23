const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // When the backend ships a `detail` field (e.g. KYC upstream error
    // bodies), surface it so the user can see what went wrong instead of an
    // opaque "HTTP 502". Cap the message length defensively.
    const j = json as { error?: string; detail?: string };
    const base = j?.error || `HTTP ${res.status}`;
    const detail = j?.detail ? ` — ${String(j.detail).slice(0, 300)}` : '';
    throw new Error(base + detail);
  }
  return json as T;
}

export const api = {
  deposit: (body: { user_id: string; amount: number; provider_id: number; phone: string }) =>
    req<{ order_id: string; status: number; transaction_id?: string }>('/api/deposit', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  withdraw: (body: { user_id: string; amount: number; provider_id: number; phone: string }) =>
    req<{ order_id: string; status: number }>('/api/withdraw', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  status: (order_id: string) => req<{ status: number }>(`/api/status/${order_id}`),
  transactions: (user_id: string) =>
    req<{ items: Array<{
      id: string;
      order_id: string;
      type: 'deposit' | 'withdrawal';
      amount: number;
      status: number;
      created_at: string;
    }> }>(`/api/transactions/${user_id}`),
  lotoTicket: (user_id: string, numeros: number[]) =>
    req<{ ticket_id: string; new_balance: number }>('/api/loto/ticket', {
      method: 'POST',
      body: JSON.stringify({ user_id, numeros }),
    }),
  lotoLatest: () =>
    req<{
      tirage: null | {
        id: string;
        numeros: number[];
        complementaire: number;
        jackpot: number;
        hash_pre: string;
        drawn_at: string;
      };
      pot_cdf: number;
    }>('/api/loto/tirage/latest'),
  lotoMesTickets: (user_id: string) =>
    req<{ tickets: Array<{
      id: string;
      numeros: number[];
      prix_cdf: number;
      gains_cdf: number;
      nb_bons: number;
      status: 'pending' | 'gagnant' | 'perdant' | 'jackpot_attente';
      jackpot_en_attente: boolean;
      tirage_id: string | null;
      created_at: string;
    }> }>('/api/loto/mes-tickets', {
      headers: { Authorization: `Bearer ${user_id}` },
    }),
  flashTicket: (user_id: string, numeros: number[]) =>
    req<{ ticket_id: string; new_balance: number }>('/api/flash/ticket', {
      method: 'POST',
      body: JSON.stringify({ user_id, numeros }),
    }),
  flashLatest: () =>
    req<{
      tirage: null | {
        id: string;
        numeros: number[];
        hash_pre: string;
        jackpot_paye: boolean;
        drawn_at: string;
      };
      pot_cdf: number;
    }>('/api/flash/tirage/latest'),
  flashMesTickets: (user_id: string) =>
    req<{ tickets: Array<{
      id: string;
      numeros: number[];
      prix_cdf: number;
      gains_cdf: number;
      nb_bons: number;
      status: 'pending' | 'gagnant' | 'perdant' | 'jackpot_attente';
      jackpot_en_attente: boolean;
      tirage_id: string | null;
      created_at: string;
    }> }>('/api/flash/mes-tickets', {
      headers: { Authorization: `Bearer ${user_id}` },
    }),
  kycScan: (user_id: string, selfie_b64: string) =>
    req<{
      verdict: 'APPROVED' | 'DENIED' | 'VERIFY_AGE';
      kyc_status: 'approved' | 'denied' | 'verify_age';
      estimated_age: number;
      age_low: number;
      age_high: number;
      is_minor: boolean;
      scan_id: string;
      blocked: boolean;
    }>('/api/kyc/scan', {
      method: 'POST',
      body: JSON.stringify({ user_id, selfie_b64 }),
    }),
};
