import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '../lib/supabase.js';
import { getMerchantBalance } from '../lib/unipesa.js';

// ---- Token / auth ----
//
// Tokens are stateless: HMAC(secret, "admin|<issued_at_ms>") signed with the
// LOTO_ADMIN_SECRET. This keeps things simple (no DB table) and ensures that
// rotating the secret invalidates outstanding tokens.

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function adminSecret(): string {
  const s = process.env.LOTO_ADMIN_SECRET || '';
  if (!s) throw new Error('LOTO_ADMIN_SECRET not configured');
  return s;
}

function signToken(): string {
  const issued = Date.now().toString();
  const nonce = randomBytes(8).toString('hex');
  const payload = `${issued}.${nonce}`;
  const sig = createHmac('sha256', adminSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [issued, nonce, sig] = parts;
  const issuedMs = Number(issued);
  if (!Number.isFinite(issuedMs)) return false;
  if (Date.now() - issuedMs > TOKEN_TTL_MS) return false;
  const expected = createHmac('sha256', adminSecret()).update(`${issued}.${nonce}`).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

function constantTimeStringEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const auth = String(req.headers['authorization'] || '');
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m || !verifyToken(m[1])) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const s = String(phone);
  if (s.length <= 4) return s;
  return s.slice(0, 2) + '****' + s.slice(-2);
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString();
}

export default async function adminRoutes(app: FastifyInstance) {
  // ---- Auth ----
  app.post<{ Body: { secret?: string } }>('/api/admin/auth', async (req, reply) => {
    const provided = String(req.body?.secret || '');
    const expected = process.env.LOTO_ADMIN_SECRET || '';
    if (!expected) return reply.code(500).send({ error: 'Admin not configured' });
    if (!provided || !constantTimeStringEqual(provided, expected)) {
      return reply.code(401).send({ error: 'Invalid secret' });
    }
    return reply.send({ token: signToken(), expires_at: Date.now() + TOKEN_TTL_MS });
  });

  // All routes below require admin auth
  app.addHook('onRequest', async (req, reply) => {
    const url = req.routeOptions?.url || req.url;
    if (!url.startsWith('/api/admin/')) return;
    if (url === '/api/admin/auth') return;
    return requireAdmin(req, reply);
  });

  // ---- OVERVIEW ----

  app.get('/api/admin/overview', async (_req, reply) => {
    try {
      const [usersAgg, usersCount, roundsToday, kycCounts] = await Promise.all([
        supabaseAdmin.from('users').select('balance_cdf'),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('okapi_rounds')
          .select('*', { count: 'exact', head: true })
          .gte('started_at', startOfTodayIso()),
        // Per-status user counts. We query the column directly and aggregate
        // in JS — cheaper than 4 separate count(*) round-trips.
        supabaseAdmin.from('users').select('kyc_status'),
      ]);

      const total_balance_cdf = (usersAgg.data || []).reduce(
        (s: number, r: any) => s + Number(r.balance_cdf || 0),
        0,
      );

      const kyc = { approved: 0, pending: 0, denied: 0, verify_age: 0 };
      for (const r of (kycCounts.data as Array<{ kyc_status?: string }>) || []) {
        const k = (r.kyc_status || 'pending') as keyof typeof kyc;
        if (k in kyc) kyc[k]++;
      }

      return reply.send({
        total_balance_cdf,
        users_count: usersCount.count ?? 0,
        okapi_rounds_today: roundsToday.count ?? 0,
        kyc,
      });
    } catch (e: any) {
      return reply.code(500).send({ error: e.message || 'overview failed' });
    }
  });

  app.get('/api/admin/avadapay-balance', async (_req, reply) => {
    try {
      const { balance_cdf, raw } = await getMerchantBalance();
      return reply.send({ balance_cdf, raw });
    } catch (e: any) {
      return reply
        .code(502)
        .send({ error: e.message || 'avadapay balance failed', balance_cdf: null });
    }
  });

  app.get<{ Querystring: { days?: string } }>('/api/admin/revenue', async (req, reply) => {
    const days = Math.min(90, Math.max(1, Number(req.query.days || 7)));
    const since = daysAgoIso(days);

    // Pull all rounds in window with their bets aggregated.
    // House profit = sum(amount of lost bets) - sum(win - amount) for won bets.
    // i.e. for each bet: lost → +amount, won → -(win - amount) = amount - win.
    const { data: bets, error } = await supabaseAdmin
      .from('okapi_bets')
      .select('amount_cdf, win_amount_cdf, status, created_at')
      .gte('created_at', since);
    if (error) return reply.code(500).send({ error: error.message });

    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (days - 1 - i));
      buckets.set(d.toISOString().slice(0, 10), 0);
    }

    for (const b of bets || []) {
      const day = String(b.created_at).slice(0, 10);
      if (!buckets.has(day)) continue;
      const amount = Number(b.amount_cdf || 0);
      const win = Number(b.win_amount_cdf || 0);
      const status = String(b.status || '');
      let profit = 0;
      if (status === 'lost') profit = amount;
      else if (status === 'won') profit = amount - win;
      buckets.set(day, (buckets.get(day) || 0) + profit);
    }

    return reply.send({
      series: Array.from(buckets.entries()).map(([day, profit_cdf]) => ({ day, profit_cdf })),
    });
  });

  app.get<{ Querystring: { limit?: string } }>('/api/admin/activity', async (req, reply) => {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));

    // We need an aggregated mixed feed. Pull a window of recent rows from
    // each source, then merge + sort by created_at desc and trim to limit.
    const fetchN = limit * 2;

    const [txs, okBets, lotoT, flashT] = await Promise.all([
      supabaseAdmin
        .from('transactions')
        .select('id, user_id, type, amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(fetchN),
      supabaseAdmin
        .from('okapi_bets')
        .select('id, user_id, amount_cdf, status, created_at')
        .order('created_at', { ascending: false })
        .limit(fetchN),
      supabaseAdmin
        .from('loto_tickets')
        .select('id, user_id, prix_cdf, created_at')
        .order('created_at', { ascending: false })
        .limit(fetchN),
      supabaseAdmin
        .from('flash_tickets')
        .select('id, user_id, prix_cdf, created_at')
        .order('created_at', { ascending: false })
        .limit(fetchN),
    ]);

    const userIds = new Set<string>();
    for (const arr of [txs.data, okBets.data, lotoT.data, flashT.data]) {
      for (const r of arr || []) userIds.add(String((r as any).user_id));
    }
    const phoneById = new Map<string, string>();
    if (userIds.size > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, phone')
        .in('id', Array.from(userIds));
      for (const u of users || []) phoneById.set(String(u.id), String(u.phone || ''));
    }

    type Event = {
      id: string;
      type: 'deposit' | 'withdrawal' | 'okapi_bet' | 'loto_ticket' | 'flash_ticket';
      amount_cdf: number;
      phone: string;
      status?: string | number;
      created_at: string;
    };
    const events: Event[] = [];
    for (const t of txs.data || []) {
      const type = t.type === 'deposit' ? 'deposit' : t.type === 'withdrawal' ? 'withdrawal' : null;
      if (!type) continue;
      events.push({
        id: String(t.id),
        type,
        amount_cdf: Number(t.amount || 0),
        phone: maskPhone(phoneById.get(String(t.user_id))),
        status: t.status,
        created_at: String(t.created_at),
      });
    }
    for (const b of okBets.data || []) {
      events.push({
        id: String(b.id),
        type: 'okapi_bet',
        amount_cdf: Number(b.amount_cdf || 0),
        phone: maskPhone(phoneById.get(String(b.user_id))),
        status: b.status,
        created_at: String(b.created_at),
      });
    }
    for (const t of lotoT.data || []) {
      events.push({
        id: String(t.id),
        type: 'loto_ticket',
        amount_cdf: Number(t.prix_cdf || 0),
        phone: maskPhone(phoneById.get(String(t.user_id))),
        created_at: String(t.created_at),
      });
    }
    for (const t of flashT.data || []) {
      events.push({
        id: String(t.id),
        type: 'flash_ticket',
        amount_cdf: Number(t.prix_cdf || 0),
        phone: maskPhone(phoneById.get(String(t.user_id))),
        created_at: String(t.created_at),
      });
    }

    events.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return reply.send({ events: events.slice(0, limit) });
  });

  // ---- JOUEURS ----

  app.get<{ Querystring: { search?: string; page?: string; page_size?: string } }>(
    '/api/admin/users',
    async (req, reply) => {
      const page = Math.max(1, Number(req.query.page || 1));
      const pageSize = Math.min(100, Math.max(1, Number(req.query.page_size || 25)));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let q = supabaseAdmin
        .from('users')
        .select('id, phone, balance_cdf, created_at, kyc_status, blocked', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (req.query.search) {
        q = q.ilike('phone', `%${req.query.search}%`);
      }
      const { data, error, count } = await q.range(from, to);
      if (error) return reply.code(500).send({ error: error.message });

      // Last activity per user (best-effort): latest of transactions, okapi_bets, loto_tickets
      const ids = (data || []).map((u: any) => u.id);
      const lastActivity = new Map<string, string>();
      if (ids.length > 0) {
        const [tx, ob, lt] = await Promise.all([
          supabaseAdmin
            .from('transactions')
            .select('user_id, created_at')
            .in('user_id', ids)
            .order('created_at', { ascending: false }),
          supabaseAdmin
            .from('okapi_bets')
            .select('user_id, created_at')
            .in('user_id', ids)
            .order('created_at', { ascending: false }),
          supabaseAdmin
            .from('loto_tickets')
            .select('user_id, created_at')
            .in('user_id', ids)
            .order('created_at', { ascending: false }),
        ]);
        const accumulate = (rows: any[] | null) => {
          for (const r of rows || []) {
            const uid = String(r.user_id);
            const ts = String(r.created_at);
            const prev = lastActivity.get(uid);
            if (!prev || prev < ts) lastActivity.set(uid, ts);
          }
        };
        accumulate(tx.data);
        accumulate(ob.data);
        accumulate(lt.data);
      }

      return reply.send({
        items: (data || []).map((u: any) => ({
          id: u.id,
          phone: u.phone,
          balance_cdf: Number(u.balance_cdf || 0),
          created_at: u.created_at,
          last_activity_at: lastActivity.get(u.id) || null,
          kyc_status: (u.kyc_status as string) || 'pending',
          blocked: !!u.blocked,
        })),
        page,
        page_size: pageSize,
        total: count ?? null,
      });
    },
  );

  app.get<{ Params: { id: string } }>('/api/admin/users/:id', async (req, reply) => {
    const id = req.params.id;
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, phone, balance_cdf, created_at, kyc_status, blocked')
      .eq('id', id)
      .maybeSingle();
    if (error) return reply.code(500).send({ error: error.message });
    if (!user) return reply.code(404).send({ error: 'Not found' });

    const [tx, bets] = await Promise.all([
      supabaseAdmin
        .from('transactions')
        .select('id, order_id, type, amount, provider_id, status, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('okapi_bets')
        .select('amount_cdf, win_amount_cdf, status')
        .eq('user_id', id),
    ]);

    let rounds_played = 0;
    let total_wagered = 0;
    let total_won = 0;
    for (const b of bets.data || []) {
      rounds_played += 1;
      total_wagered += Number(b.amount_cdf || 0);
      total_won += Number(b.win_amount_cdf || 0);
    }

    // Last 5 KYC checks for this user (audit trail).
    const { data: kycChecks } = await supabaseAdmin
      .from('kyc_checks')
      .select('id, verdict, estimated_age, age_low, age_high, is_minor, confidence, scan_id, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    return reply.send({
      user,
      transactions: tx.data || [],
      okapi: {
        rounds_played,
        total_wagered_cdf: total_wagered,
        total_won_cdf: total_won,
        pnl_cdf: total_won - total_wagered,
      },
      kyc_checks: kycChecks || [],
    });
  });

  app.post<{ Params: { id: string }; Body: { delta_cdf: number; reason?: string } }>(
    '/api/admin/users/:id/balance',
    async (req, reply) => {
      const id = req.params.id;
      const delta = Number(req.body?.delta_cdf || 0);
      if (!Number.isFinite(delta) || delta === 0) {
        return reply.code(400).send({ error: 'delta_cdf required' });
      }
      const { data, error } = await supabaseAdmin.rpc('adjust_balance', {
        p_user_id: id,
        p_delta: delta,
      });
      if (error) return reply.code(400).send({ error: error.message });
      return reply.send({ new_balance_cdf: Number(data ?? 0) });
    },
  );

  app.post<{ Params: { id: string }; Body: { blocked?: boolean } }>(
    '/api/admin/users/:id/block',
    async (req, reply) => {
      // The `blocked` column is created by the playguard-kyc migration
      // (2026-05-23-playguard-kyc.sql). If you see a column-missing error
      // here, run that migration.
      const id = req.params.id;
      const blocked = !!req.body?.blocked;
      const { error } = await supabaseAdmin
        .from('users')
        .update({ blocked })
        .eq('id', id);
      if (error) {
        return reply.code(400).send({
          error: error.message,
          hint: "Add 'blocked boolean default false' column on public.users to enable user blocking.",
        });
      }
      return reply.send({ ok: true, blocked });
    },
  );

  // ---- JEUX ----

  app.get<{ Querystring: { page?: string; page_size?: string } }>(
    '/api/admin/okapi/rounds',
    async (req, reply) => {
      const page = Math.max(1, Number(req.query.page || 1));
      const pageSize = Math.min(100, Math.max(1, Number(req.query.page_size || 25)));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: rounds, error, count } = await supabaseAdmin
        .from('okapi_rounds')
        .select('id, crash_point, started_at, ended_at', { count: 'exact' })
        .order('started_at', { ascending: false })
        .range(from, to);
      if (error) return reply.code(500).send({ error: error.message });

      const ids = (rounds || []).map((r: any) => r.id);
      const agg = new Map<string, { total_bets: number; total_cashouts: number; house_profit: number }>();
      if (ids.length > 0) {
        const { data: bets } = await supabaseAdmin
          .from('okapi_bets')
          .select('round_id, amount_cdf, win_amount_cdf, status')
          .in('round_id', ids);
        for (const b of bets || []) {
          const k = String(b.round_id);
          const cur = agg.get(k) || { total_bets: 0, total_cashouts: 0, house_profit: 0 };
          cur.total_bets += Number(b.amount_cdf || 0);
          cur.total_cashouts += Number(b.win_amount_cdf || 0);
          if (b.status === 'lost') cur.house_profit += Number(b.amount_cdf || 0);
          else if (b.status === 'won')
            cur.house_profit += Number(b.amount_cdf || 0) - Number(b.win_amount_cdf || 0);
          agg.set(k, cur);
        }
      }

      return reply.send({
        items: (rounds || []).map((r: any) => ({
          id: r.id,
          crash_point: Number(r.crash_point || 0),
          started_at: r.started_at,
          ended_at: r.ended_at,
          ...(agg.get(r.id) || { total_bets: 0, total_cashouts: 0, house_profit: 0 }),
        })),
        page,
        page_size: pageSize,
        total: count ?? null,
      });
    },
  );

  app.get<{ Querystring: { page?: string; page_size?: string; type?: string } }>(
    '/api/admin/loto/tirages',
    async (req, reply) => {
      const page = Math.max(1, Number(req.query.page || 1));
      const pageSize = Math.min(100, Math.max(1, Number(req.query.page_size || 25)));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const type = (req.query.type || 'all').toLowerCase();

      type Tirage = {
        id: string;
        type: 'congo' | 'flash';
        drawn_at: string;
        numeros: number[];
        jackpot_cdf: number | null;
        winners_count: number;
      };

      const result: Tirage[] = [];

      if (type === 'all' || type === 'congo') {
        const { data: tirages, error } = await supabaseAdmin
          .from('loto_tirages')
          .select('id, numeros, complementaire, jackpot, drawn_at')
          .order('drawn_at', { ascending: false })
          .range(from, to);
        if (error) return reply.code(500).send({ error: error.message });
        const ids = (tirages || []).map((t: any) => t.id);
        const winners = new Map<string, number>();
        if (ids.length > 0) {
          const { data: w } = await supabaseAdmin
            .from('loto_tickets')
            .select('tirage_id, status')
            .in('tirage_id', ids)
            .eq('status', 'gagnant');
          for (const row of w || []) {
            const k = String(row.tirage_id);
            winners.set(k, (winners.get(k) || 0) + 1);
          }
        }
        for (const t of tirages || []) {
          result.push({
            id: String(t.id),
            type: 'congo',
            drawn_at: String(t.drawn_at),
            numeros: [...(t.numeros || []), Number(t.complementaire)],
            jackpot_cdf: t.jackpot != null ? Number(t.jackpot) : null,
            winners_count: winners.get(String(t.id)) || 0,
          });
        }
      }

      if (type === 'all' || type === 'flash') {
        const { data: tirages, error } = await supabaseAdmin
          .from('flash_tirages')
          .select('id, numeros, drawn_at')
          .order('drawn_at', { ascending: false })
          .range(from, to);
        if (error) return reply.code(500).send({ error: error.message });
        const ids = (tirages || []).map((t: any) => t.id);
        const winners = new Map<string, number>();
        if (ids.length > 0) {
          const { data: w } = await supabaseAdmin
            .from('flash_tickets')
            .select('tirage_id, status')
            .in('tirage_id', ids)
            .eq('status', 'gagnant');
          for (const row of w || []) {
            const k = String(row.tirage_id);
            winners.set(k, (winners.get(k) || 0) + 1);
          }
        }
        for (const t of tirages || []) {
          result.push({
            id: String(t.id),
            type: 'flash',
            drawn_at: String(t.drawn_at),
            numeros: t.numeros || [],
            jackpot_cdf: null,
            winners_count: winners.get(String(t.id)) || 0,
          });
        }
      }

      result.sort((a, b) => (a.drawn_at < b.drawn_at ? 1 : -1));
      return reply.send({
        items: result.slice(0, pageSize),
        page,
        page_size: pageSize,
      });
    },
  );

  // ---- TRANSACTIONS ----

  function buildTxQuery(query: any) {
    let q = supabaseAdmin
      .from('transactions')
      .select('id, user_id, order_id, type, amount, currency, provider_id, status, transaction_id, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });
    const status = query.status;
    if (status && status !== 'all') {
      if (status === 'success') q = q.eq('status', 2);
      else if (status === 'failed') q = q.eq('status', 3);
      else if (status === 'pending') q = q.in('status', [0, 1]);
    }
    if (query.provider && query.provider !== 'all') {
      q = q.eq('provider_id', Number(query.provider));
    }
    if (query.type && query.type !== 'all') {
      q = q.eq('type', query.type);
    }
    if (query.from) q = q.gte('created_at', new Date(query.from).toISOString());
    if (query.to) {
      const d = new Date(query.to);
      d.setHours(23, 59, 59, 999);
      q = q.lte('created_at', d.toISOString());
    }
    return q;
  }

  app.get<{ Querystring: Record<string, string> }>('/api/admin/transactions', async (req, reply) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(200, Math.max(1, Number(req.query.page_size || 50)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await buildTxQuery(req.query).range(from, to);
    if (error) return reply.code(500).send({ error: error.message });

    const ids = Array.from(new Set((data || []).map((t: any) => String(t.user_id))));
    const phoneById = new Map<string, string>();
    if (ids.length > 0) {
      const { data: users } = await supabaseAdmin.from('users').select('id, phone').in('id', ids);
      for (const u of users || []) phoneById.set(String(u.id), String(u.phone || ''));
    }

    return reply.send({
      items: (data || []).map((t: any) => ({
        id: t.id,
        order_id: t.order_id,
        user_id: t.user_id,
        phone: phoneById.get(String(t.user_id)) || null,
        phone_masked: maskPhone(phoneById.get(String(t.user_id))),
        type: t.type,
        amount_cdf: Number(t.amount || 0),
        currency: t.currency,
        provider_id: t.provider_id,
        status: t.status,
        transaction_id: t.transaction_id,
        created_at: t.created_at,
      })),
      page,
      page_size: pageSize,
      total: count ?? null,
    });
  });

  app.get<{ Querystring: Record<string, string> }>('/api/admin/transactions/export', async (req, reply) => {
    const { data, error } = await buildTxQuery(req.query).limit(10000);
    if (error) return reply.code(500).send({ error: error.message });
    const ids = Array.from(new Set((data || []).map((t: any) => String(t.user_id))));
    const phoneById = new Map<string, string>();
    if (ids.length > 0) {
      const { data: users } = await supabaseAdmin.from('users').select('id, phone').in('id', ids);
      for (const u of users || []) phoneById.set(String(u.id), String(u.phone || ''));
    }
    const header = 'created_at,phone,type,amount_cdf,currency,provider_id,status,order_id,transaction_id\n';
    const rows = (data || []).map((t: any) => {
      const phone = phoneById.get(String(t.user_id)) || '';
      return [
        t.created_at,
        phone,
        t.type,
        Number(t.amount || 0),
        t.currency || 'CDF',
        t.provider_id,
        t.status,
        t.order_id,
        t.transaction_id || '',
      ]
        .map((v) => {
          const s = String(v ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',');
    });
    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="transactions-${Date.now()}.csv"`);
    return reply.send(header + rows.join('\n') + '\n');
  });
}
