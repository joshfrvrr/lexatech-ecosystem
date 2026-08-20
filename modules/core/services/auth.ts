import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../data/db.js';
import { users, organizations } from '../data/schema.js';

export async function registerTenant(email: string, passwordPlain: string, orgName: string) {
  const normalizedEmail = email.trim().toLowerCase();
  // 1. Check if the user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existingUser.length > 0) {
    throw new Error('A user with this email already exists.');
  }

  // 2. Hash the password (Cost factor of 12 is a secure standard for 2026)
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(passwordPlain, salt);

  // 3. Database Transaction: We must create the Org and User together.
  // If the user creation fails, the org creation rolls back automatically.
  return await db.transaction(async (tx) => {
    
    const [newOrg] = await tx.insert(organizations).values({
      name: orgName,
    }).returning();
    if (!newOrg) throw new Error('Organization creation failed.');

    const [newUser] = await tx.insert(users).values({
      email: normalizedEmail,
      passwordHash,
      orgId: newOrg.id,
    }).returning({
      // Explicitly pick fields to return, NEVER return the password hash
      id: users.id,
      email: users.email,
      orgId: users.orgId,
      createdAt: users.createdAt,
    });
    if (!newUser) throw new Error('User creation failed.');

    return { user: newUser, organization: newOrg };
  });
}

export async function authenticateUser(email: string, passwordPlain: string) {
  const normalizedEmail = email.trim().toLowerCase();
  // 1. Locate the user
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  // 2. Compare the provided password against the stored hash
  const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password.'); // Keep error generic to prevent email enumeration
  }

  // 3. Return a clean user object
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function getCurrentAccount(userId: string) {
  const [account] = await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      organization: {
        id: organizations.id,
        name: organizations.name,
      },
    })
    .from(users)
    .innerJoin(organizations, eq(users.orgId, organizations.id))
    .where(eq(users.id, userId))
    .limit(1);

  return account ?? null;
}

export async function updateAccount(
  userId: string,
  orgId: string,
  input: { email: string; orgName: string },
) {
  const email = input.email.trim().toLowerCase();
  await db.transaction(async (tx) => {
    await tx.update(organizations).set({ name: input.orgName.trim() })
      .where(eq(organizations.id, orgId));
    await tx.update(users).set({ email }).where(eq(users.id, userId));
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !await bcrypt.compare(currentPassword, user.passwordHash)) {
    throw new Error('CURRENT_PASSWORD_INVALID');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function ensureLocalTestAccount() {
  const email = 'admin@lexatech.test';
  const password = 'LexaTechTest#2026';
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    await db.update(users)
      .set({ passwordHash: await bcrypt.hash(password, 12) })
      .where(eq(users.id, existing.id));
    return;
  }
  await registerTenant(email, password, 'LexaTech Test Company');
}
