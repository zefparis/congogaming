import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import crypto from 'node:crypto';
import { supabaseAdmin } from '../lib/supabase.js';

const TICKET_PRICE_CDF = 2000;
const JACKPOT_CONTRIB_CDF = 1000;
const DEFAULT_JACKPOT_CDF = 5_000_000;

const PRIZE_TABLE: Record<number, number> = {
  5: 500_000,
  4: 50_000,
  3: 5_000,
  2: 1_000,
  1: 0,
  0: 0,
};

function extractBearer(req: FastifyRequest): string | null {
  const h = req.headers['authorization'] || req.headers['Authorization' as 'authorization'];
  if (!h || typeof h !== 'string') return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function isValidLotoNumbers(nums: unknown): nums is number[] {
  if (!Array.isArray(nums) || nums.length !== 6) return false;
  const set = new Set<number>();
  for (const n of nums) {
    if (!Number.isInteger(n)) return false;
    if ((n as number) < 1 || (n as number) > 49) return false;
    set.add(n as number);
  }
  return set.size === 6;
}

function drawSevenUniqueNumbers(): number[] {
  const picked = new Set<number>();
  while (picked.size < 7) {
    const buf = crypto.randomBytes(2);
    const v = (buf.readUInt16BE(0) % 49) + 1;
    picked.add(v);
  }
  return Array.from(picked);
}

const lotoRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // GET latest tirage
  app.get('/api/loto/tirage/latest', async (_req, reply) => {
    const { data, error } = await supabaseAdmin
      .from('loto_tirages')
      .select('*')
      .order('drawn_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return reply.code(500).send({ error: error.message });
    const { data: jackpotRow } = await supabaseAdmin
      .from('loto_jackpot')
      .select('pot_cdf')
      .eq('id', 1)
      .single();
    return reply.send({
      tirage: data || null,
      pot_cdf: Number(jackpotRow?.pot_cdf ?? 0),
    });
  });

  // GET my tickets (auth via Bearer <user_id>)
  app.get('/api/loto/mes-tickets', async (req, reply) => {
    const user_id = extractBearer(req);
    if (!user_id) return reply.code(401).send({ error: 'Unauthorized' });
    const { data, error } = await supabaseAdmin
      .from('loto_tickets')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ tickets: data || [] });
  });

  // POST buy ticket
  app.post('/api/loto/ticket', async (req, reply) => {
    const { user_id, numeros } = (req.body || {}) as { user_id?: string; numeros?: number[] };
    if (!user_id) return reply.code(400).send({ error: 'user_id requis' });
    if (!isValidLotoNumbers(numeros)) {
      return reply.code(400).send({ error: 'numeros invalides : 6 entiers distincts entre 1 et 49' });
    }

    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('balance_cdf')
      .eq('id', user_id)
      .single();
    if (userErr || !user) return reply.code(404).send({ error: 'User not found' });
    if (Number(user.balance_cdf) < TICKET_PRICE_CDF) {
      return reply.code(400).send({ error: 'Solde insuffisant' });
    }

    // Debit
    const { error: decErr } = await supabaseAdmin.rpc('adjust_balance', {
      p_user_id: user_id,
      p_delta: -TICKET_PRICE_CDF,
    });
    if (decErr) return reply.code(500).send({ error: decErr.message });

    const { data: ticket, error: insErr } = await supabaseAdmin
      .from('loto_tickets')
      .insert({
        user_id,
        numeros: numeros as number[],
        prix_cdf: TICKET_PRICE_CDF,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insErr || !ticket) {
      // refund on insert failure
      await supabaseAdmin.rpc('adjust_balance', { p_user_id: user_id, p_delta: TICKET_PRICE_CDF });
      return reply.code(500).send({ error: insErr?.message || 'Insert failed' });
    }

    // Feed jackpot pool
    await supabaseAdmin.rpc('increment_jackpot', { delta: JACKPOT_CONTRIB_CDF });

    return reply.send({
      ticket_id: ticket.id,
      new_balance: Number(user.balance_cdf) - TICKET_PRICE_CDF,
    });
  });

  // POST admin tirage
  app.post('/api/loto/tirage', async (req, reply) => {
    const adminSecret = process.env.LOTO_ADMIN_SECRET || '';
    const provided = req.headers['x-admin-secret'];
    if (!adminSecret || provided !== adminSecret) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const all = drawSevenUniqueNumbers();
    const numeros = all.slice(0, 6).sort((a, b) => a - b);
    const complementaire = all[6];
    const ts = Date.now();
    const hash_pre = crypto
      .createHash('sha256')
      .update(JSON.stringify({ numeros, complementaire, ts }))
      .digest('hex');

    const jackpot = Number(process.env.LOTO_JACKPOT_CDF || DEFAULT_JACKPOT_CDF);

    const { data: tirage, error: tirErr } = await supabaseAdmin
      .from('loto_tirages')
      .insert({ numeros, complementaire, jackpot, hash_pre })
      .select('*')
      .single();
    if (tirErr || !tirage) return reply.code(500).send({ error: tirErr?.message || 'Tirage insert failed' });

    // Lire pot jackpot
    const { data: jackpotRow } = await supabaseAdmin
      .from('loto_jackpot')
      .select('pot_cdf')
      .eq('id', 1)
      .single();
    const potActuel = Number(jackpotRow?.pot_cdf ?? 0);
    const SEUIL = Number(process.env.LOTO_JACKPOT_CDF ?? DEFAULT_JACKPOT_CDF);
    const jackpotDispo = potActuel >= SEUIL;
    let jackpotPaye = false;

    function calculGains(nbBons: number, jackpotDisponible: boolean): number {
      if (nbBons === 6) return jackpotDisponible ? SEUIL : 0;
      if (nbBons === 5) return 500_000;
      if (nbBons === 4) return 50_000;
      if (nbBons === 3) return 5_000;
      if (nbBons === 2) return 1_000;
      return 0;
    }

    // Process pending tickets
    const { data: pending, error: pendErr } = await supabaseAdmin
      .from('loto_tickets')
      .select('id, user_id, numeros')
      .eq('status', 'pending');
    if (pendErr) return reply.code(500).send({ error: pendErr.message });

    const winSet = new Set<number>(numeros);
    let processed = 0;

    for (const t of pending || []) {
      const tNums: number[] = Array.isArray(t.numeros) ? t.numeros : [];
      const nb_bons = tNums.reduce((acc, n) => acc + (winSet.has(n) ? 1 : 0), 0);
      const isSix = nb_bons === 6;
      const gains_cdf = calculGains(nb_bons, jackpotDispo);
      const jackpot_en_attente = isSix && !jackpotDispo;

      let status: 'gagnant' | 'perdant' | 'jackpot_attente';
      if (jackpot_en_attente) {
        status = 'jackpot_attente';
      } else if (gains_cdf > 0) {
        status = 'gagnant';
      } else {
        status = 'perdant';
      }

      if (gains_cdf > 0 && !jackpot_en_attente) {
        await supabaseAdmin.rpc('adjust_balance', { p_user_id: t.user_id, p_delta: gains_cdf });
        if (isSix) {
          jackpotPaye = true;
          await supabaseAdmin.rpc('increment_jackpot', { delta: -SEUIL });
        }
      }

      await supabaseAdmin
        .from('loto_tickets')
        .update({
          status,
          nb_bons,
          gains_cdf,
          jackpot_en_attente,
          tirage_id: tirage.id,
        })
        .eq('id', t.id);

      processed++;
    }

    return reply.send({
      tirage_id: tirage.id,
      tickets_traites: processed,
      pot_jackpot: potActuel,
      jackpot_declenche: jackpotPaye,
    });
  });
};

export default lotoRoutes;
