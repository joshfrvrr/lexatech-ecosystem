import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticateUser, changePassword, getCurrentAccount, registerTenant, updateAccount } from '../services/auth.js';
import { clearSessionCookie, requireAuth, setSessionCookie } from '../services/session.js';

const authRouter = new Hono();

const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters.')
  .max(128, 'Password is too long.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[0-9]/, 'Password must include a number.');

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: passwordSchema,
  orgName: z.string().trim().min(2).max(255),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

const profileSchema = z.object({
  email: z.string().trim().email('Enter a valid work email.').max(255),
  orgName: z.string().trim().min(2, 'Organisation name is required.').max(255),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.').max(128),
  newPassword: passwordSchema,
});

authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, orgName } = c.req.valid('json');
  try {
    const result = await registerTenant(email, password, orgName);
    await setSessionCookie(c, result.user.id, result.user.orgId);
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    console.error('Registration failed', error);
    const message = error instanceof Error && error.message.includes('already exists')
      ? 'An account with this email already exists. Try signing in instead.'
      : 'We could not create your workspace. Please check your details and try again.';
    return c.json({ success: false, error: message }, 400);
  }
});

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  try {
    const user = await authenticateUser(email, password);
    await setSessionCookie(c, user.id, user.orgId);
    return c.json({ success: true, data: { user } });
  } catch {
    return c.json({ success: false, error: 'Invalid email or password.' }, 401);
  }
});

authRouter.get('/me', requireAuth, async (c) => {
  const account = await getCurrentAccount(c.get('userId'));
  if (!account) {
    clearSessionCookie(c);
    return c.json({ success: false, error: 'Account not found.' }, 401);
  }
  return c.json({ success: true, data: account });
});

authRouter.patch('/me', requireAuth, zValidator('json', profileSchema), async (c) => {
  try {
    await updateAccount(c.get('userId'), c.get('orgId'), c.req.valid('json'));
    const account = await getCurrentAccount(c.get('userId'));
    return c.json({ success: true, data: account });
  } catch (error) {
    console.error('Profile update failed', error);
    return c.json({
      success: false,
      error: 'We could not update your profile. The email may already be in use.',
    }, 400);
  }
});

authRouter.patch('/password', requireAuth, zValidator('json', changePasswordSchema), async (c) => {
  const { currentPassword, newPassword } = c.req.valid('json');
  try {
    await changePassword(c.get('userId'), currentPassword, newPassword);
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'CURRENT_PASSWORD_INVALID') {
      return c.json({ success: false, error: 'Your current password is incorrect.' }, 400);
    }
    console.error('Password update failed', error);
    return c.json({ success: false, error: 'We could not update your password.' }, 400);
  }
});

authRouter.post('/logout', requireAuth, (c) => {
  clearSessionCookie(c);
  return c.json({ success: true });
});

export { authRouter };
