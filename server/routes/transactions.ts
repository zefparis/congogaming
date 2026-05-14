import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../lib/supabase.js';

export default async function transactionsRoutes(app: FastifyInstance) {
  app.get<{ Params: { user_id: string } }>('/api/transactions/:user_id', async (req, reply) => {
    const { user_id } = req.params;
    if (!user_id) return reply.code(400).send({ error: 'user_id required' });

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('id, order_id, type, amount, currency, provider_id, status, transaction_id, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ items: data || [] });
  });
}
