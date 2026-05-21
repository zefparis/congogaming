import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_KEY || '';

if (!url || !key) {
  console.warn('[supabase] SUPABASE_URL or SUPABASE_SERVICE_KEY not set — DB operations will fail.');
}

export const supabaseAdmin = createClient(url || 'http://localhost', key || 'anon', {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Returns the configured Supabase admin client, or null if env vars are missing.
 * Used by the Okapi Climb engine for best-effort persistence.
 */
export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  return supabaseAdmin;
}

/**
 * Adjusts a user's balance by calling the `adjust_balance` Postgres RPC.
 * Returns the new balance, or null if Supabase is not configured.
 */
export async function adjustBalance(
  userId: string,
  delta: number,
): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('adjust_balance', {
    p_user_id: userId,
    p_delta: delta,
  });
  if (error) throw new Error(error.message);
  return (data as unknown as number) ?? 0;
}
