import type { FastifyInstance } from 'fastify';
import { verifyCallbackSignature } from '../lib/unipesa.js';
import { supabaseAdmin } from '../lib/supabase.js';

export default async function callbackRoutes(app: FastifyInstance) {
  app.post('/api/callback', async (req, reply) => {
    const body = (req.body || {}) as Record<string, any>;
    app.log.info({ body }, 'unipesa callback');

    const valid = verifyCallbackSignature(body);
    if (!valid) {
      app.log.warn('invalid callback signature');
      return reply.code(401).send({ error: 'Invalid signature' });
    }

    const order_id = String(body.order_id || '');
    const status = Number(body.status ?? 0);
    const transaction_id = body.transaction_id ? String(body.transaction_id) : null;

    if (!order_id) return reply.code(400).send({ error: 'Missing order_id' });

    const { data: tx, error: txErr } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('order_id', order_id)
      .maybeSingle();
    if (txErr || !tx) {
      app.log.warn({ order_id }, 'tx not found in callback');
      return reply.code(200).send({ ok: true });
    }

    // Only credit/debit once on first success
    const wasNotSuccess = tx.status !== 2;
    await supabaseAdmin
      .from('transactions')
      .update({ status, transaction_id })
      .eq('order_id', order_id);

    if (status === 2 && wasNotSuccess) {
      if (tx.type === 'deposit') {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('balance_cdf')
          .eq('id', tx.user_id)
          .single();
        const newBal = Number(user?.balance_cdf || 0) + Number(tx.amount);
        await supabaseAdmin.from('users').update({ balance_cdf: newBal }).eq('id', tx.user_id);
      }
      // For withdrawal, balance was already deducted at request time.
    }

    if (status === 3 && tx.type === 'withdrawal' && wasNotSuccess) {
      // refund
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance_cdf')
        .eq('id', tx.user_id)
        .single();
      const newBal = Number(user?.balance_cdf || 0) + Number(tx.amount);
      await supabaseAdmin.from('users').update({ balance_cdf: newBal }).eq('id', tx.user_id);
    }

    return reply.code(200).send({ ok: true });
  });
}
