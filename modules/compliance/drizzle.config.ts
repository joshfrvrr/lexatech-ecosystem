import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './data/schema.ts',
  out: './data/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/lexatech',
  },
});