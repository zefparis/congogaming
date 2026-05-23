import type { FastifyPluginAsync } from 'fastify';
import { getSupabase } from '../lib/supabase.js';

interface BalanceQuery {
  user_id?: string;
}

/**
 * Canonical wallet balance endpoint.
 * Returns the authoritative `public.users.balance_cdf` for the given user_id.
 * Used by gameplay clients (e.g. Okapi Climb) so the displayed balance never
 * drifts from the DB due to stale localStorage sessions or client-side math.
 */
const walletRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: BalanceQuery }>(
    '/api/wallet/balance',
    async (req, reply) => {
      const user_id = req.query?.user_id;
      if (!user_id || typeof user_id !== 'string') {
        return reply.code(400).send({ error: 'Missing user_id' });
      }
      const sb = getSupabase();
      if (!sb) {
        return reply.code(503).send({ error: 'Database not configured' });
      }
      const { data, error } = await sb
        .from('users')
        .select('balance_cdf')
        .eq('id', user_id)
        .maybeSingle();
      if (error) {
        app.log.error({ err: error.message, user_id }, 'wallet balance query failed');
        return reply.code(500).send({ error: 'Balance query failed' });
      }
      if (!data) {
        return reply.code(404).send({ error: 'User not found' });
      }
      return reply.send({ balance: Number(data.balance_cdf ?? 0) });
    },
  );
};

export default walletRoutes;
export { walletRoutes };
