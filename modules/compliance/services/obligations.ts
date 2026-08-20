import { eq, sql } from 'drizzle-orm';
import { db } from '../data/db.js';
import { obligations, statusEnum } from '../data/schema.js';

// Define the exact shape of the data needed to create an obligation
export interface CreateObligationDTO {
  orgId: string;
  title: string;
  description?: string;
  dueDate?: Date;
}

/**
 * Creates a new compliance obligation for an organization.
 */
export async function createObligation(data: CreateObligationDTO) {
  const [newObligation] = await db.insert(obligations).values({
    orgId: data.orgId,
    title: data.title,
    description: data.description,
    // Status defaults to 'pending' at the database level
    dueDate: data.dueDate,
  }).returning();

  return newObligation;
}

/**
 * Calculates the overall compliance score for a specific organization (0 to 100).
 * Formula: (Compliant Obligations / Total Obligations) * 100
 */
export async function calculateComplianceScore(orgId: string) {
  // Fetch all obligations for this specific organization
  const allObligations = await db
    .select({
      status: obligations.status,
    })
    .from(obligations)
    .where(eq(obligations.orgId, orgId));

  const total = allObligations.length;
  
  // If they have no obligations, their score is 100% by default
  if (total === 0) {
    return { score: 100, total: 0, compliant: 0 };
  }

  // Count how many are strictly 'compliant'
  const compliantCount = allObligations.filter(ob => ob.status === 'compliant').length;

  // Calculate the percentage and round to the nearest whole number
  const score = Math.round((compliantCount / total) * 100);

  return {
    score,
    total,
    compliant: compliantCount,
  };
}