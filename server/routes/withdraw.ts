import type { FastifyInstance } from 'fastify';
import { newOrderId, paymentB2C } from '../lib/unipesa.js';
import { supabaseAdmin } from '../lib/supabase.js';

export default async function withdrawRoutes(app: FastifyInstance) {
  app.post('/api/withdraw', async (req, reply) => {
    const { user_id, amount, provider_id, phone } = (req.body || {}) as {
      user_id?: string; amount?: number; provider_id?: number; phone?: string;
    };
    if (!user_id || !amount || !provider_id || !phone) {
      return reply.code(400).send({ error: 'Missing fields' });
    }
    if (amount < 500) return reply.code(400).send({ error: 'Min 500 CDF' });

    // Check balance
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('balance_cdf')
      .eq('id', user_id)
      .single();
    if (userErr || !user) return reply.code(404).send({ error: 'User not found' });
    if (Number(user.balance_cdf) < amount) {
      return reply.code(400).send({ error: 'Insufficient balance' });
    }

    const order_id = newOrderId();

    // Reserve funds (decrement immediately, refund if failed)
    const { error: decErr } = await supabaseAdmin.rpc('adjust_balance', {
      p_user_id: user_id,
      p_delta: -amount,
    });
    if (decErr) {
      // Fallback if RPC not present
      await supabaseAdmin
        .from('users')
        .update({ balance_cdf: Number(user.balance_cdf) - amount })
        .eq('id', user_id);
    }

    await supabaseAdmin.from('transactions').insert({
      user_id,
      order_id,
      type: 'withdrawal',
      amount,
      currency: 'CDF',
      provider_id,
      status: 0,
    });

    try {
      const r = await paymentB2C({ order_id, customer_id: phone, amount, provider_id });
      const status = Number(r.status ?? 1);
      await supabaseAdmin
        .from('transactions')
        .update({ status, transaction_id: r.transaction_id || null })
        .eq('order_id', order_id);
      return reply.send({ order_id, status });
    } catch (e: any) {
      // refund
      await supabaseAdmin.rpc('adjust_balance', { p_user_id: user_id, p_delta: amount }).then(() => {}, async () => {
        await supabaseAdmin
          .from('users')
          .update({ balance_cdf: Number(user.balance_cdf) })
          .eq('id', user_id);
      });
      await supabaseAdmin.from('transactions').update({ status: 3 }).eq('order_id', order_id);
      return reply.code(502).send({ error: e?.message || 'Payment provider error', order_id });
    }
  });
}
