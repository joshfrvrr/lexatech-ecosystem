import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { getEmbeddedDatabase, usesEmbeddedDatabase } from '@lexatech/database';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const pgDatabase = databaseUrl
  ? drizzlePg(new pg.Pool({ connectionString: databaseUrl, max: 10, connectionTimeoutMillis: 5000 }))
  : undefined;

export const db = (usesEmbeddedDatabase()
  ? drizzlePglite(getEmbeddedDatabase())
  : pgDatabase) as NonNullable<typeof pgDatabase>;
