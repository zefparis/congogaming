import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../lib/supabase.js';
import { generateGrid } from '../lib/scratchEngine.js';

const ALLOWED_BETS = new Set([500, 1000, 2000, 5000]);

export default async function scratchRoutes(app: FastifyInstance) {
  // POST /api/scratch/buy — debits the bet, generates a grid, returns the
  // ticket id + symbols (win amount is stored server-side and only revealed
  // on /claim, so a tampered client can't short-circuit the outcome).
  app.post<{ Body: { user_id?: string; bet_amount_cdf?: number } }>(
    '/api/scratch/buy',
    async (req, reply) => {
      try {
        const user_id = String(req.body?.user_id || '');
        const bet = Number(req.body?.bet_amount_cdf || 0);
        if (!user_id) return reply.code(400).send({ error: 'user_id_required' });
        if (!ALLOWED_BETS.has(bet)) return reply.code(400).send({ error: 'invalid_bet' });

        // Atomically debit the bet (RPC enforces non-negative balance).
        const { error: debitErr } = await supabaseAdmin.rpc('adjust_balance', {
          p_user_id: user_id,
          p_delta: -bet,
        });
        if (debitErr) return reply.code(400).send({ error: debitErr.message });

        const { grid, win } = generateGrid(bet);
        const { data: ticket, error: insErr } = await supabaseAdmin
          .from('scratch_tickets')
          .insert({
            user_id,
            bet_amount_cdf: bet,
            grid,
            win_amount_cdf: win,
            status: 'pending',
          })
          .select('id')
          .single();
        if (insErr || !ticket) {
          // Best-effort refund if we couldn't persist the ticket.
          try {
            await supabaseAdmin.rpc('adjust_balance', { p_user_id: user_id, p_delta: bet });
          } catch {
            /* ignore refund failure */
          }
          return reply.code(500).send({ error: insErr?.message || 'ticket_insert_failed' });
        }

        return reply.send({
          ticket_id: ticket.id,
          grid_hidden: true,
          bet_amount_cdf: bet,
          grid, // symbols only — payout not exposed
        });
      } catch (e: any) {
        req.log.error({ err: e }, '[scratch/buy]');
        return reply.code(500).send({ error: e.message ?? 'server_error' });
      }
    },
  );

  // POST /api/scratch/claim — marks the ticket claimed, credits any win,
  // returns the win amount + new balance.
  app.post<{ Body: { user_id?: string; ticket_id?: string } }>(
    '/api/scratch/claim',
    async (req, reply) => {
      try {
        const user_id = String(req.body?.user_id || '');
        const ticket_id = String(req.body?.ticket_id || '');
        if (!user_id || !ticket_id) return reply.code(400).send({ error: 'bad_request' });

        const { data: ticket, error: getErr } = await supabaseAdmin
          .from('scratch_tickets')
          .select('id, user_id, win_amount_cdf, status, grid')
          .eq('id', ticket_id)
          .maybeSingle();
        if (getErr) return reply.code(500).send({ error: getErr.message });
        if (!ticket || ticket.user_id !== user_id) {
          return reply.code(404).send({ error: 'ticket_not_found' });
        }
        if (ticket.status === 'claimed') {
          return reply.code(400).send({ error: 'already_claimed' });
        }

        const { error: updErr } = await supabaseAdmin
          .from('scratch_tickets')
          .update({ status: 'claimed' })
          .eq('id', ticket_id);
        if (updErr) return reply.code(500).send({ error: updErr.message });

        let new_balance = 0;
        const win = Number(ticket.win_amount_cdf || 0);
        if (win > 0) {
          const { data: bal, error: credErr } = await supabaseAdmin.rpc('adjust_balance', {
            p_user_id: user_id,
            p_delta: win,
          });
          if (credErr) return reply.code(500).send({ error: credErr.message });
          new_balance = Number(bal ?? 0);
        } else {
          const { data: u } = await supabaseAdmin
            .from('users')
            .select('balance_cdf')
            .eq('id', user_id)
            .maybeSingle();
          new_balance = Number(u?.balance_cdf ?? 0);
        }

        return reply.send({
          win_amount_cdf: win,
          new_balance,
          grid: ticket.grid,
        });
      } catch (e: any) {
        req.log.error({ err: e }, '[scratch/claim]');
        return reply.code(500).send({ error: e.message ?? 'server_error' });
      }
    },
  );
}
