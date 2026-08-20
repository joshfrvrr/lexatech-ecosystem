import { serve } from '@hono/node-server';
import { Hono } from 'hono';

// Import the routers directly from your isolated business modules
import { authRouter } from '@lexatech/core';
import { obligationsRouter } from '@lexatech/compliance';

const app = new Hono();

// Basic health check route
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount the modules
app.route('/api/auth', authRouter);
app.route('/api/compliance/obligations', obligationsRouter);

const port = 3000;
console.log(`🚀 LexaTech API Gateway running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});