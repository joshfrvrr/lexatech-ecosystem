import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createObligation,
  deleteObligation,
  getDashboard,
  listObligations,
  updateObligation,
} from '../services/obligations.js';

type Variables = { orgId: string; userId: string };
const obligationsRouter = new Hono<{ Variables: Variables }>();
const statuses = ['compliant', 'at_risk', 'non_compliant', 'pending'] as const;

const createSchema = z.object({
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(statuses).optional(),
});

const updateSchema = createSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required.',
);

const idSchema = z.object({ id: z.string().uuid() });

obligationsRouter.get('/', async (c) => {
  const data = await listObligations(c.get('orgId'));
  return c.json({ success: true, data });
});

obligationsRouter.get('/dashboard', async (c) => {
  const data = await getDashboard(c.get('orgId'));
  return c.json({ success: true, data });
});

obligationsRouter.post('/', zValidator('json', createSchema), async (c) => {
  const input = c.req.valid('json');
  const data = await createObligation({
    ...input,
    orgId: c.get('orgId'),
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
  });
  return c.json({ success: true, data }, 201);
});

obligationsRouter.patch(
  '/:id',
  zValidator('param', idSchema),
  zValidator('json', updateSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const input = c.req.valid('json');
    const data = await updateObligation(c.get('orgId'), id, {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    });
    if (!data) return c.json({ success: false, error: 'Obligation not found.' }, 404);
    return c.json({ success: true, data });
  },
);

obligationsRouter.delete('/:id', zValidator('param', idSchema), async (c) => {
  const { id } = c.req.valid('param');
  const data = await deleteObligation(c.get('orgId'), id);
  if (!data) return c.json({ success: false, error: 'Obligation not found.' }, 404);
  return c.json({ success: true });
});

export { obligationsRouter };
