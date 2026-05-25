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

    // Use the atomic `adjust_balance` RPC for every credit/debit so we
    // never race read-modify-write against another concurrent callback
    // or game action (scratch credit, climb cashout, etc).

    // DEPOSIT credit on first success.
    if (status === 2 && wasNotSuccess && tx.type === 'deposit') {
      await supabaseAdmin.rpc('adjust_balance', {
        p_user_id: tx.user_id,
        p_delta: Number(tx.amount),
      });
    }

    // WITHDRAWAL refund when the provider ultimately fails (status 3).
    // The amount was debited at request time, so we credit it back.
    if (status === 3 && tx.type === 'withdrawal' && wasNotSuccess) {
      await supabaseAdmin.rpc('adjust_balance', {
        p_user_id: tx.user_id,
        p_delta: Number(tx.amount),
      });
    }

    return reply.code(200).send({ ok: true });
  });
}
