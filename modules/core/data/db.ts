import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const { Pool } = pg;

// In a real environment, ensure process.env.DATABASE_URL is set
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/lexatech',
});

export const db = drizzle(pool);
