import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './modules/compliance/data/schema.ts',
  out: './modules/compliance/data/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/lexatech',
  },
});
