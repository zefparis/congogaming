const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
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
};
