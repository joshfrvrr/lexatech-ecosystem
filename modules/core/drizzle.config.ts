import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './modules/core/data/schema.ts',
  out: './modules/core/data/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});
