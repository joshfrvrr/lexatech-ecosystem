import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { registerTenant, authenticateUser } from '../services/auth.js';

const authRouter = new Hono();

// 1. Define the exact shape of expected data
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgName: z.string().min(2, "Organization name is required"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// 2. Registration Endpoint
authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, orgName } = c.req.valid('json');
  
  try {
    const result = await registerTenant(email, password, orgName);
    return c.json({ success: true, data: result }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 3. Login Endpoint
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  
  try {
    const user = await authenticateUser(email, password);
    // Note: In a production app, you would generate and return a JWT or session cookie here
    return c.json({ success: true, data: user }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 401);
  }
});

export { authRouter };