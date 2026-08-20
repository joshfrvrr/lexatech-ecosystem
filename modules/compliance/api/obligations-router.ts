import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createObligation, calculateComplianceScore } from '../services/obligations.js';

const obligationsRouter = new Hono();

// Define the exact shape of incoming data for creating an obligation
const createObligationSchema = z.object({
  orgId: z.string().uuid("Invalid Organization ID"),
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(), // Ensures a valid ISO date string
});

// Endpoint 1: Create a new obligation
obligationsRouter.post(
  '/', 
  zValidator('json', createObligationSchema), 
  async (c) => {
    const validData = c.req.valid('json');
    
    // Convert the string date back to a Date object if it exists
    const parsedDate = validData.dueDate ? new Date(validData.dueDate) : undefined;
    
    try {
      const result = await createObligation({
        ...validData,
        dueDate: parsedDate,
      });
      return c.json({ success: true, data: result }, 201);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
);

// Endpoint 2: Get the compliance score for a specific organization
obligationsRouter.get('/:orgId/score', async (c) => {
  const orgId = c.req.param('orgId');
  
  // Basic validation to ensure it looks like a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orgId)) {
    return c.json({ success: false, error: "Invalid Organization ID format" }, 400);
  }

  try {
    const scoreData = await calculateComplianceScore(orgId);
    return c.json({ success: true, data: scoreData }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export { obligationsRouter };