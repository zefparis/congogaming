import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import depositRoutes from './routes/deposit.js';
import withdrawRoutes from './routes/withdraw.js';
import callbackRoutes from './routes/callback.js';
import statusRoutes from './routes/status.js';
import transactionsRoutes from './routes/transactions.js';
import lotoRoutes from './routes/loto.js';
import flashRoutes from './routes/flash.js';
import { okapiRoutes } from './routes/okapi.js';
import okapiAutoRoutes from './routes/okapi-auto.js';
import walletRoutes from './routes/wallet.js';
import adminRoutes from './routes/admin.js';
import kycRoutes from './routes/kyc.js';
import { engine } from './lib/okapi-engine.js';
import { startCrons } from './cron.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://congogaming.com', 'https://www.congogaming.com', 'http://localhost:5173'] });

await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

await app.register(websocket);

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
await app.register(okapiRoutes);
await app.register(okapiAutoRoutes);
await app.register(walletRoutes);
await app.register(adminRoutes);
await app.register(kycRoutes);

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host }).then(() => {
  app.log.info(`API listening on http://${host}:${port}`);
  // Dump the route table on boot so deploys (Render etc.) make it obvious
  // which paths are actually registered. If /api/game/cashout is missing
  // here, the deploy is stale.
  app.log.info('Registered routes:\n' + app.printRoutes());
  startCrons();
  engine.start();
  app.log.info('Okapi Climb engine started');
}).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
