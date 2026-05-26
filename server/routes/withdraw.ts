import type { FastifyInstance } from 'fastify';
import { newOrderId, paymentB2C } from '../lib/unipesa.js';
import { supabaseAdmin, adjustBalance } from '../lib/supabase.js';

function normalizePhone(phone: string, provider_id: number): string {
  phone = phone.replace(/\s/g, '');
  if (provider_id === 17) { // Airtel: 9XXXXXXXX (no 0, no 243)
    if (phone.startsWith('243')) phone = phone.slice(3);
    if (phone.startsWith('0')) phone = phone.slice(1);
    return phone;
  }
  if (provider_id === 10) { // Orange: 0XXXXXXXXX
    if (phone.startsWith('243')) phone = '0' + phone.slice(3);
    if (!phone.startsWith('0')) phone = '0' + phone;
    return phone;
  }
  // Africell (19): format 0XXXXXXXXX (same as Orange)
  if (provider_id === 19) {
    if (phone.startsWith('243')) phone = '0' + phone.slice(3);
    if (!phone.startsWith('0')) phone = '0' + phone;
    return phone;
  }
  return phone;
}

export default async function withdrawRoutes(app: FastifyInstance) {
  app.post('/api/withdraw', async (req, reply) => {
    const { user_id, amount, provider_id, phone } = (req.body || {}) as {
      user_id?: string; amount?: number; provider_id?: number; phone?: string;
    };
    if (!user_id || !amount || !provider_id || !phone) {
      return reply.code(400).send({ error: 'Missing fields' });
    }
    if (amount < 500) return reply.code(400).send({ error: 'Min 500 CDF' });

    const order_id = newOrderId();

    // Atomic debit + non-negative check via RPC
    let newBalance: number;
    try {
      newBalance = await adjustBalance(user_id, -amount);
    } catch (err: any) {
      app.log.warn({ err: err?.message, user_id, amount }, 'adjust_balance debit failed');
      if (err?.message?.includes('Insufficient')) {
        return reply.code(400).send({ error: 'Insufficient balance' });
      }
      return reply.code(500).send({ error: 'Balance error' });
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

    const normalizedPhone = normalizePhone(phone, provider_id);
    app.log.info({ original: phone, normalized: normalizedPhone, provider_id }, 'phone normalized for unipesa b2c');

    try {
      const r = await paymentB2C({ order_id, customer_id: normalizedPhone, amount, provider_id });
      const status = Number(r.status ?? 1);
      await supabaseAdmin
        .from('transactions')
        .update({ status, transaction_id: r.transaction_id || null })
        .eq('order_id', order_id);
      return reply.send({ order_id, status, balance: newBalance });
    } catch (e: any) {
      // Refund atomically
      try {
        await adjustBalance(user_id, amount);
      } catch (refundErr: any) {
        app.log.error({ err: refundErr?.message, user_id, amount, order_id }, 'refund failed');
      }
      await supabaseAdmin.from('transactions').update({ status: 3 }).eq('order_id', order_id);
      return reply.code(502).send({ error: e?.message || 'Payment provider error', order_id });
    }
  });
}
