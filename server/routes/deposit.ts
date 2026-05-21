import type { FastifyInstance } from 'fastify';
import { newOrderId, paymentC2B } from '../lib/unipesa.js';
import { supabaseAdmin } from '../lib/supabase.js';

function normalizePhone(phone: string, provider_id: number): string {
  // Remove all spaces
  phone = phone.replace(/\s/g, '');

  // Airtel (17): format 9XXXXXXXX (sans 0, sans 243)
  if (provider_id === 17) {
    if (phone.startsWith('243')) phone = phone.slice(3);
    if (phone.startsWith('0')) phone = phone.slice(1);
    return phone;
  }

  // Orange (10): format 0XXXXXXXXX
  if (provider_id === 10) {
    if (phone.startsWith('243')) phone = '0' + phone.slice(3);
    if (!phone.startsWith('0')) phone = '0' + phone;
    return phone;
  }

  // Default: return as-is
  return phone;
}

export default async function depositRoutes(app: FastifyInstance) {
  app.post('/api/deposit', async (req, reply) => {
    const { user_id, amount, provider_id, phone } = (req.body || {}) as {
      user_id?: string; amount?: number; provider_id?: number; phone?: string;
    };
    if (!user_id || !amount || !provider_id || !phone) {
      return reply.code(400).send({ error: 'Missing fields' });
    }
    if (amount < 100) return reply.code(400).send({ error: 'Amount too low' });

    const order_id = newOrderId();

    const { error: insertErr } = await supabaseAdmin.from('transactions').insert({
      user_id,
      order_id,
      type: 'deposit',
      amount,
      currency: 'CDF',
      provider_id,
      status: 0,
    });
    if (insertErr) {
      app.log.error({ err: insertErr }, 'insert transaction failed');
      return reply.code(500).send({ error: 'DB insert failed' });
    }

    const normalizedPhone = normalizePhone(phone, provider_id);
    app.log.info({ original: phone, normalized: normalizedPhone, provider_id }, 'phone normalized for unipesa');

    try {
      const r = await paymentC2B({ order_id, customer_id: normalizedPhone, amount, provider_id });
      const status = Number(r.status ?? 1);
      const transaction_id = r.transaction_id || null;
      await supabaseAdmin
        .from('transactions')
        .update({ status, transaction_id })
        .eq('order_id', order_id);
      return reply.send({ order_id, status, transaction_id });
    } catch (e: any) {
      app.log.error({ err: e?.message }, 'unipesa c2b failed');
      await supabaseAdmin.from('transactions').update({ status: 3 }).eq('order_id', order_id);
      return reply.code(502).send({ error: e?.message || 'Payment provider error', order_id });
    }
  });
}
