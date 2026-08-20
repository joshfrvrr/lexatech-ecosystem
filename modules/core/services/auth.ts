import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../data/db.js';
import { users, organizations } from '../data/schema.js';

export async function registerTenant(email: string, passwordPlain: string, orgName: string) {
  // 1. Check if the user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
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

    const [newUser] = await tx.insert(users).values({
      email,
      passwordHash,
      orgId: newOrg.id,
    }).returning({
      // Explicitly pick fields to return, NEVER return the password hash
      id: users.id,
      email: users.email,
      orgId: users.orgId,
      createdAt: users.createdAt,
    });

    return { user: newUser, organization: newOrg };
  });
}

export async function authenticateUser(email: string, passwordPlain: string) {
  // 1. Locate the user
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
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