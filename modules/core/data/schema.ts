import { pgSchema, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// 1. The Boundary
export const core = pgSchema('core');

// 2. Organizations
export const organizations = core.table('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Users
export const users = core.table('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Roles
export const roles = core.table('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
});

// 5. Permissions
export const permissions = core.table('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
}, (table) => ({
  actionResourceIdx: uniqueIndex('action_resource_idx').on(table.action, table.resource)
}));

// 6. Role Permissions
export const rolePermissions = core.table('role_permissions', {
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id).notNull(),
});

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
