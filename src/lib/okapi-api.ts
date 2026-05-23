const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface BetResponse {
  bet_id: string
  // null when the server is running without Supabase configured.
  balance: number | null
}

export interface CashoutResponse {
  win_amount: number
  multiplier: number
  // null when the server is running without Supabase configured.
  balance: number | null
}

export interface HistoryResponse {
  history: number[]
}

export interface BalanceResponse {
  balance: number
}

export interface AutoStartParams {
  user_id: string
  bet_amount_cdf: number
  target_multiplier: number
  max_rounds: number | null
  stop_on_profit_cdf?: number | null
  stop_on_loss_cdf?: number | null
}

export interface AutoStartResponse {
  session_id: string
}

export interface AutoProgressResponse {
  rounds_played: number
  total_pnl_cdf: number
  status: 'active' | 'completed' | 'aborted'
  finished: boolean
}

export interface AutoActiveSession {
  id: string
  bet_amount_cdf: number
  target_multiplier: number
  max_rounds: number | null
  stop_on_profit_cdf: number | null
  stop_on_loss_cdf: number | null
  rounds_played: number
  total_pnl_cdf: number
  status: 'active'
  created_at: string
}

export interface AutoActiveResponse {
  session: AutoActiveSession | null
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    // Try to pull a more specific message from JSON payloads like
    // `{ error: '...', detail: '...' }` so the UI can show the real cause.
    let extra = ''
    try {
      const j = JSON.parse(text) as { error?: string; detail?: string }
      if (j.detail) extra = ` ${j.detail}`
      else if (j.error) extra = ` ${j.error}`
    } catch {
      /* not json */
    }
    throw new Error(`API error ${res.status}: ${text}${extra}`)
  }
  return res.json() as Promise<T>
}

export const okapiApi = {
  placeBet: (
    user_id: string,
    amount_cdf: number,
    auto_session_id?: string | null,
  ) =>
    request<BetResponse>('/api/game/bet', {
      method: 'POST',
      body: JSON.stringify({ user_id, amount_cdf, auto_session_id }),
    }),
  cashout: (user_id: string, bet_id: string) =>
    request<CashoutResponse>('/api/game/cashout', {
      method: 'POST',
      body: JSON.stringify({ user_id, bet_id }),
    }),
  history: () => request<HistoryResponse>('/api/game/history'),
  getBalance: (user_id: string) =>
    request<BalanceResponse>(
      `/api/wallet/balance?user_id=${encodeURIComponent(user_id)}`,
    ),
  autoStart: (params: AutoStartParams) =>
    request<AutoStartResponse>('/api/okapi/auto/start', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  autoProgress: (session_id: string, user_id: string, delta_cdf: number) =>
    request<AutoProgressResponse>('/api/okapi/auto/progress', {
      method: 'POST',
      body: JSON.stringify({ session_id, user_id, delta_cdf }),
    }),
  autoActive: (user_id: string) =>
    request<AutoActiveResponse>(
      `/api/okapi/auto/active?user_id=${encodeURIComponent(user_id)}`,
    ),
  autoStop: (
    session_id: string,
    user_id: string,
    reason: 'completed' | 'stopped' | 'aborted' = 'stopped',
  ) =>
    request<{ ok: boolean; status: string }>('/api/okapi/auto/stop', {
      method: 'POST',
      body: JSON.stringify({ session_id, user_id, reason }),
    }),
}
