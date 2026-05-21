import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import depositRoutes from './routes/deposit.js';
import withdrawRoutes from './routes/withdraw.js';
import callbackRoutes from './routes/callback.js';
import statusRoutes from './routes/status.js';
import transactionsRoutes from './routes/transactions.js';
import lotoRoutes from './routes/loto.js';
import flashRoutes from './routes/flash.js';
import { startCrons } from './cron.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'https://congogaming-seven.vercel.app'] });

await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

app.get('/health', async () => ({ ok: true, service: 'congo-gaming-api' }));

if (process.env.NODE_ENV !== 'production') {
  app.get('/api/myip', async (req, reply) => {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return { ip: data.ip };
  });
}

await app.register(depositRoutes);
await app.register(withdrawRoutes);
await app.register(callbackRoutes);
await app.register(statusRoutes);
await app.register(transactionsRoutes);
await app.register(lotoRoutes);
await app.register(flashRoutes);

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host }).then(() => {
  app.log.info(`API listening on http://${host}:${port}`);
  startCrons();
}).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
