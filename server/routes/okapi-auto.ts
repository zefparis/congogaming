import type { FastifyPluginAsync } from 'fastify';
import { getSupabase } from '../lib/supabase.js';

/**
 * Okapi Climb auto-bet (Aviator-style) session endpoints.
 *
 * The auto-bet loop is driven entirely client-side. These endpoints only
 * persist the session metadata + running stats so we have an audit trail
 * and so the user can review their auto sessions later.
 */

interface StartBody {
  user_id?: string;
  bet_amount_cdf?: number;
  target_multiplier?: number;
  max_rounds?: number | null;       // null/undefined => infinite
  stop_on_profit_cdf?: number | null;
  stop_on_loss_cdf?: number | null;
}

interface StopBody {
  session_id?: string;
  user_id?: string;
  /** completed | stopped | aborted (stop-on-profit/loss). */
  reason?: 'completed' | 'stopped' | 'aborted';
}

interface ProgressBody {
  session_id?: string;
  user_id?: string;
  /** signed CDF delta for the round (negative for losses). */
  delta_cdf?: number;
}

const okapiAutoRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: StartBody }>('/api/okapi/auto/start', async (req, reply) => {
    const {
      user_id,
      bet_amount_cdf,
      target_multiplier,
      max_rounds,
      stop_on_profit_cdf,
      stop_on_loss_cdf,
    } = req.body || ({} as StartBody);

    if (!user_id) return reply.code(400).send({ error: 'Missing user_id' });
    if (!bet_amount_cdf || bet_amount_cdf < 100) {
      return reply.code(400).send({ error: 'Mise minimale 100 CDF' });
    }
    if (!target_multiplier || target_multiplier < 1.01) {
      return reply.code(400).send({ error: 'target_multiplier must be >= 1.01' });
    }

    const sb = getSupabase();
    if (!sb) return reply.code(503).send({ error: 'Database not configured' });

    // Mark any previously-active session for this user as 'stopped' to avoid
    // multiple concurrent sessions per user.
    await sb
      .from('okapi_auto_sessions')
      .update({ status: 'stopped', ended_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('status', 'active');

    const { data, error } = await sb
      .from('okapi_auto_sessions')
      .insert({
        user_id,
        bet_amount_cdf,
        target_multiplier,
        max_rounds: max_rounds ?? null,
        stop_on_profit_cdf: stop_on_profit_cdf || null,
        stop_on_loss_cdf: stop_on_loss_cdf || null,
      })
      .select('id')
      .single();

    if (error || !data) {
      app.log.error({ err: error?.message, code: error?.code }, 'okapi auto start failed');
      // Surface the underlying Supabase error so the operator can diagnose
      // missing-table / RLS / column-mismatch issues without digging in logs.
      // The most common cause in production is that the migration
      // `supabase/migrations/2026-05-23-okapi-auto-sessions.sql` has not been
      // applied yet (table does not exist).
      return reply.code(500).send({
        error: 'Could not start session',
        detail: error?.message || 'unknown supabase error',
        code: error?.code || null,
      });
    }
    return reply.send({ session_id: data.id });
  });

  app.post<{ Body: ProgressBody }>(
    '/api/okapi/auto/progress',
    async (req, reply) => {
      const { session_id, user_id, delta_cdf } = req.body || ({} as ProgressBody);
      if (!session_id || !user_id || typeof delta_cdf !== 'number') {
        return reply.code(400).send({ error: 'Missing fields' });
      }
      const sb = getSupabase();
      if (!sb) return reply.code(503).send({ error: 'Database not configured' });

      // Read-modify-write. Safe enough here since a single user runs at most
      // one auto session at a time and rounds are sequential.
      const { data: row, error: readErr } = await sb
        .from('okapi_auto_sessions')
        .select('rounds_played,total_pnl_cdf,status,max_rounds,stop_on_profit_cdf,stop_on_loss_cdf')
        .eq('id', session_id)
        .eq('user_id', user_id)
        .maybeSingle();

      if (readErr || !row) {
        return reply.code(404).send({ error: 'Session not found' });
      }
      if (row.status !== 'active') {
        return reply.code(409).send({ error: 'Session not active' });
      }

      const rounds_played = (row.rounds_played ?? 0) + 1;
      const total_pnl_cdf = (row.total_pnl_cdf ?? 0) + Math.trunc(delta_cdf);

      // Auto-finalize if thresholds reached.
      let status: 'active' | 'completed' | 'aborted' = 'active';
      if (row.max_rounds != null && rounds_played >= row.max_rounds) {
        status = 'completed';
      } else if (
        row.stop_on_profit_cdf &&
        total_pnl_cdf >= row.stop_on_profit_cdf
      ) {
        status = 'aborted';
      } else if (
        row.stop_on_loss_cdf &&
        total_pnl_cdf <= -Math.abs(row.stop_on_loss_cdf)
      ) {
        status = 'aborted';
      }

      const patch: Record<string, unknown> = { rounds_played, total_pnl_cdf };
      if (status !== 'active') {
        patch.status = status;
        patch.ended_at = new Date().toISOString();
      }

      const { error: updErr } = await sb
        .from('okapi_auto_sessions')
        .update(patch)
        .eq('id', session_id);

      if (updErr) {
        app.log.error({ err: updErr.message }, 'okapi auto progress failed');
        return reply.code(500).send({ error: 'Update failed' });
      }

      return reply.send({
        rounds_played,
        total_pnl_cdf,
        status,
        finished: status !== 'active',
      });
    },
  );

  // GET active session for a user — used by the client on mount to restore
  // an in-progress auto-bet session after navigation/page reload.
  app.get<{ Querystring: { user_id?: string } }>(
    '/api/okapi/auto/active',
    async (req, reply) => {
      const user_id = req.query?.user_id;
      if (!user_id) return reply.code(400).send({ error: 'Missing user_id' });
      const sb = getSupabase();
      if (!sb) return reply.code(503).send({ error: 'Database not configured' });

      const { data, error } = await sb
        .from('okapi_auto_sessions')
        .select(
          'id,bet_amount_cdf,target_multiplier,max_rounds,stop_on_profit_cdf,stop_on_loss_cdf,rounds_played,total_pnl_cdf,status,created_at',
        )
        .eq('user_id', user_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        app.log.error({ err: error.message }, 'okapi auto active fetch failed');
        return reply.code(500).send({ error: 'Fetch failed' });
      }
      if (!data) return reply.send({ session: null });
      return reply.send({ session: data });
    },
  );

  app.post<{ Body: StopBody }>('/api/okapi/auto/stop', async (req, reply) => {
    const { session_id, user_id, reason } = req.body || ({} as StopBody);
    if (!session_id || !user_id) {
      return reply.code(400).send({ error: 'Missing fields' });
    }
    const sb = getSupabase();
    if (!sb) return reply.code(503).send({ error: 'Database not configured' });

    const status =
      reason === 'completed' || reason === 'aborted' ? reason : 'stopped';

    const { error } = await sb
      .from('okapi_auto_sessions')
      .update({ status, ended_at: new Date().toISOString() })
      .eq('id', session_id)
      .eq('user_id', user_id)
      .eq('status', 'active');

    if (error) {
      app.log.error({ err: error.message }, 'okapi auto stop failed');
      return reply.code(500).send({ error: 'Stop failed' });
    }
    return reply.send({ ok: true, status });
  });
};

export default okapiAutoRoutes;
export { okapiAutoRoutes };
