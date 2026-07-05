import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '../db';
import { treatments, risks, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import type { Env, Variables } from '../middleware/auth';

const treatmentsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 1. Get all treatment plans joined with risk title and owner name
treatmentsRouter.get('/', async (c) => {
  const db = getDb(c.env.DB);
  
  try {
    const items = await db.select({
      id: treatments.id,
      riskId: treatments.riskId,
      riskTitle: risks.title,
      riskIdentifier: risks.riskId,
      ownerId: treatments.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
      budget: treatments.budget,
      dueDate: treatments.dueDate,
      progressPercent: treatments.progressPercent,
      status: treatments.status,
      description: treatments.description,
      createdAt: treatments.createdAt,
      updatedAt: treatments.updatedAt,
    })
    .from(treatments)
    .leftJoin(risks, eq(treatments.riskId, risks.id))
    .leftJoin(users, eq(treatments.ownerId, users.id))
    .all();

    return c.json(items);
  } catch (err: any) {
    console.error('Fetch treatments error:', err);
    return c.json({ error: err.message }, 500);
  }
});

const treatmentSchema = z.object({
  riskId: z.string(),
  ownerId: z.string().optional().nullable(),
  budget: z.number().min(0),
  dueDate: z.string(), // ISO String
  progressPercent: z.number().int().min(0).max(100).default(0),
  status: z.enum(['planned', 'in_progress', 'completed', 'deferred']),
  description: z.string().optional().nullable(),
});

// 2. Create treatment plan (Admin, CISO, Risk Manager, Risk Owner)
treatmentsRouter.post('/', requireRole(['super_admin', 'ciso', 'risk_manager', 'risk_owner']), async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json();
  const result = treatmentSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const data = result.data;

  // Check if a treatment plan already exists for this risk
  const existing = await db.select().from(treatments).where(eq(treatments.riskId, data.riskId)).get();
  if (existing) {
    return c.json({ error: 'A treatment plan is already defined for this risk' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(treatments).values({
    id,
    riskId: data.riskId,
    ownerId: data.ownerId || null,
    budget: data.budget,
    dueDate: new Date(data.dueDate),
    progressPercent: data.progressPercent,
    status: data.status,
    description: data.description || null,
    createdAt: now,
    updatedAt: now,
  });

  // Automatically update the risk status to 'treating' if the treatment plan is in progress
  if (data.status === 'in_progress') {
    await db.update(risks).set({ status: 'treating', updatedAt: now }).where(eq(risks.id, data.riskId));
  } else if (data.status === 'completed') {
    await db.update(risks).set({ status: 'mitigated', updatedAt: now }).where(eq(risks.id, data.riskId));
  }

  await logAuditAction(c, 'TREATMENT_CREATE', { id, riskId: data.riskId });

  return c.json({ id, ...data });
});

// 3. Update treatment plan (Admin, CISO, Risk Manager, Risk Owner)
treatmentsRouter.put('/:id', requireRole(['super_admin', 'ciso', 'risk_manager', 'risk_owner']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = treatmentSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const existing = await db.select().from(treatments).where(eq(treatments.id, id)).get();
  if (!existing) {
    return c.json({ error: 'Treatment plan not found' }, 404);
  }

  const data = result.data;
  const now = new Date();

  await db.update(treatments)
    .set({
      ownerId: data.ownerId || null,
      budget: data.budget,
      dueDate: new Date(data.dueDate),
      progressPercent: data.progressPercent,
      status: data.status,
      description: data.description || null,
      updatedAt: now,
    })
    .where(eq(treatments.id, id));

  // Sync back to risk status
  if (data.status === 'completed') {
    await db.update(risks).set({ status: 'mitigated', updatedAt: now }).where(eq(risks.id, existing.riskId));
  } else if (data.status === 'in_progress') {
    await db.update(risks).set({ status: 'treating', updatedAt: now }).where(eq(risks.id, existing.riskId));
  }

  await logAuditAction(c, 'TREATMENT_UPDATE', { id, riskId: existing.riskId });

  return c.json({ id, ...data });
});

// 4. Delete treatment plan (Admin, CISO, Risk Manager only)
treatmentsRouter.delete('/:id', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  const existing = await db.select().from(treatments).where(eq(treatments.id, id)).get();
  if (!existing) {
    return c.json({ error: 'Treatment plan not found' }, 404);
  }

  await db.delete(treatments).where(eq(treatments.id, id));
  await logAuditAction(c, 'TREATMENT_DELETE', { id, riskId: existing.riskId });

  return c.json({ success: true });
});

export default treatmentsRouter;
