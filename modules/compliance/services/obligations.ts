import { and, asc, eq } from 'drizzle-orm';
import { db } from '../data/db.js';
import { obligations } from '../data/schema.js';

export type ObligationStatus = 'compliant' | 'at_risk' | 'non_compliant' | 'pending';

export interface CreateObligationDTO {
  orgId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  status?: ObligationStatus;
}

export async function createObligation(data: CreateObligationDTO) {
  const [created] = await db.insert(obligations).values({
    orgId: data.orgId,
    title: data.title,
    description: data.description,
    dueDate: data.dueDate,
    status: data.status ?? 'pending',
  }).returning();
  return created;
}

export function listObligations(orgId: string) {
  return db.select().from(obligations)
    .where(eq(obligations.orgId, orgId))
    .orderBy(asc(obligations.dueDate), asc(obligations.createdAt));
}

export async function updateObligation(
  orgId: string,
  obligationId: string,
  data: Partial<Pick<CreateObligationDTO, 'title' | 'description' | 'dueDate' | 'status'>>,
) {
  const [updated] = await db.update(obligations)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(obligations.id, obligationId), eq(obligations.orgId, orgId)))
    .returning();
  return updated ?? null;
}

export async function deleteObligation(orgId: string, obligationId: string) {
  const [deleted] = await db.delete(obligations)
    .where(and(eq(obligations.id, obligationId), eq(obligations.orgId, orgId)))
    .returning({ id: obligations.id });
  return deleted ?? null;
}

export async function getDashboard(orgId: string) {
  const items = await listObligations(orgId);
  const now = new Date();
  const inThirtyDays = new Date(now);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);

  const compliant = items.filter((item) => item.status === 'compliant').length;
  const atRisk = items.filter((item) => item.status === 'at_risk' || item.status === 'non_compliant').length;
  const overdue = items.filter((item) =>
    item.dueDate && item.dueDate < now && item.status !== 'compliant'
  ).length;
  const upcoming = items.filter((item) =>
    item.dueDate && item.dueDate >= now && item.dueDate <= inThirtyDays && item.status !== 'compliant'
  ).length;

  return {
    score: items.length === 0 ? 100 : Math.round((compliant / items.length) * 100),
    total: items.length,
    compliant,
    atRisk,
    overdue,
    upcoming,
    obligations: items,
  };
}
