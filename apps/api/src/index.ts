import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { authRouter, ensureLocalTestAccount, requireAuth } from '@lexatech/core';
import { obligationsRouter } from '@lexatech/compliance';
import { initializeEmbeddedDatabase, usesEmbeddedDatabase } from '@lexatech/database';

const app = new Hono();
const attempts = new Map<string, { count: number; resetAt: number }>();

app.use('*', secureHeaders());
app.use('/api/*', bodyLimit({ maxSize: 1024 * 1024 }));

app.use('/api/*', async (c, next) => {
  const method = c.req.method;
  const origin = c.req.header('origin');
  const allowedOrigin = process.env.APP_ORIGIN ?? 'http://localhost:3000';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && origin && origin !== allowedOrigin) {
    return c.json({ success: false, error: 'Request origin is not allowed.' }, 403);
  }
  await next();
});

app.use('/api/auth/login', rateLimit);
app.use('/api/auth/register', rateLimit);

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.route('/api/auth', authRouter);
app.use('/api/compliance/*', requireAuth);
app.route('/api/compliance/obligations', obligationsRouter);

app.notFound((c) => c.json({ success: false, error: 'Route not found.' }, 404));
app.onError((error, c) => {
  console.error('Unhandled API error', error);
  return c.json({
    success: false,
    error: 'Something went wrong while processing your request. Please try again.',
  }, 500);
});

async function rateLimit(c: Parameters<Parameters<typeof app.use>[1]>[0], next: () => Promise<void>) {
  const key = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const now = Date.now();
  const current = attempts.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + 60_000 }
    : { count: current.count + 1, resetAt: current.resetAt };
  attempts.set(key, entry);

  c.header('RateLimit-Limit', '10');
  c.header('RateLimit-Remaining', String(Math.max(0, 10 - entry.count)));
  if (entry.count > 10) {
    c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    return c.json({ success: false, error: 'Too many attempts. Try again shortly.' }, 429);
  }
  await next();
}

const port = Number(process.env.PORT ?? 3002);
await initializeEmbeddedDatabase();
if (usesEmbeddedDatabase()) console.log('Using embedded local database.');
if (process.env.ENABLE_TEST_ACCOUNT === 'true' && process.env.NODE_ENV !== 'production') {
  await ensureLocalTestAccount();
  console.log('Local test account is ready.');
}
console.log(`LexaTech API Gateway running at http://localhost:${port}`);
serve({ fetch: app.fetch, port });
