import { PGlite } from '@electric-sql/pglite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

let localDatabase: PGlite | undefined;

export function usesEmbeddedDatabase() {
  return !process.env.DATABASE_URL;
}

export function getEmbeddedDatabase() {
  if (!localDatabase) {
    const dataDirectory = resolve(process.env.PGLITE_DATA_DIR ?? '../../.data/lexatech');
    mkdirSync(dirname(dataDirectory), { recursive: true });
    localDatabase = new PGlite(dataDirectory);
  }
  return localDatabase;
}

export async function initializeEmbeddedDatabase() {
  if (!usesEmbeddedDatabase()) return;
  await getEmbeddedDatabase().exec(`
    CREATE SCHEMA IF NOT EXISTS core;
    CREATE TABLE IF NOT EXISTS core.organizations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(255) NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS core.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES core.organizations(id),
      email varchar(255) NOT NULL UNIQUE, password_hash varchar(255) NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS core.roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES core.organizations(id),
      name varchar(100) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS core.permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), action varchar(100) NOT NULL, resource varchar(100) NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS action_resource_idx ON core.permissions(action, resource);
    CREATE TABLE IF NOT EXISTS core.role_permissions (
      role_id uuid NOT NULL REFERENCES core.roles(id), permission_id uuid NOT NULL REFERENCES core.permissions(id)
    );
    CREATE SCHEMA IF NOT EXISTS compliance;
    DO $$ BEGIN
      CREATE TYPE compliance.status AS ENUM ('compliant', 'at_risk', 'non_compliant', 'pending');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE TABLE IF NOT EXISTS compliance.obligations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL, title varchar(255) NOT NULL,
      description text, status compliance.status DEFAULT 'pending' NOT NULL, due_date timestamp,
      created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS compliance.evidence (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      obligation_id uuid NOT NULL REFERENCES compliance.obligations(id) ON DELETE CASCADE,
      file_url varchar(512) NOT NULL, uploaded_by uuid NOT NULL, created_at timestamp DEFAULT now() NOT NULL
    );
  `);
}
