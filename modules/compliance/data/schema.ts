import { pgSchema, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// 1. The Boundary
export const compliance = pgSchema('compliance');

// 2. Enums
export const statusEnum = compliance.enum('status', ['compliant', 'at_risk', 'non_compliant', 'pending']);

// 3. Obligations Table
export const obligations = compliance.table('obligations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(), // Soft link to @lexatech/core organizations table
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: statusEnum('status').default('pending').notNull(),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Evidence Table
export const evidence = compliance.table('evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  obligationId: uuid('obligation_id').references(() => obligations.id, { onDelete: 'cascade' }).notNull(),
  fileUrl: varchar('file_url', { length: 512 }).notNull(),
  uploadedBy: uuid('uploaded_by').notNull(), // Soft link to @lexatech/core users table
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Obligation = typeof obligations.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
