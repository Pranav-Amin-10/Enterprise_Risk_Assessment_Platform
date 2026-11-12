import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '../db';
import { risks, assets, threats, vulnerabilities, riskControls } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import type { Env, Variables } from '../middleware/auth';

const risksRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 1. Get all risks with joined relations
risksRouter.get('/', async (c) => {
  const db = getDb(c.env.DB);
  
  try {
    const items = await db.select({
      id: risks.id,
      riskId: risks.riskId,
      title: risks.title,
      description: risks.description,
      assetId: risks.assetId,
      assetName: assets.name,
      assetCriticality: assets.criticality,
      departmentId: assets.departmentId,
      threatId: risks.threatId,
      threatName: threats.name,
      vulnerabilityId: risks.vulnerabilityId,
      vulnerabilityName: vulnerabilities.name,
      inherentImpact: risks.inherentImpact,
      inherentLikelihood: risks.inherentLikelihood,
      inherentScore: risks.inherentScore,
      residualImpact: risks.residualImpact,
      residualLikelihood: risks.residualLikelihood,
      residualScore: risks.residualScore,
      treatmentStrategy: risks.treatmentStrategy,
      riskOwnerId: risks.riskOwnerId,
      status: risks.status,
      reviewDate: risks.reviewDate,
      notes: risks.notes,
      createdAt: risks.createdAt,
      updatedAt: risks.updatedAt,
    })
    .from(risks)
    .leftJoin(assets, eq(risks.assetId, assets.id))
    .leftJoin(threats, eq(risks.threatId, threats.id))
    .leftJoin(vulnerabilities, eq(risks.vulnerabilityId, vulnerabilities.id))
    .all();

    return c.json(items);
  } catch (err: any) {
    console.error('Fetch risks error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 2. Get specific risk details with linked controls
risksRouter.get('/:id', async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  const riskObj = await db.select().from(risks).where(eq(risks.id, id)).get();
  if (!riskObj) {
    return c.json({ error: 'Risk not found' }, 404);
  }

  const controls = await db.select().from(riskControls).where(eq(riskControls.riskId, id)).all();

  return c.json({
    ...riskObj,
    controls,
  });
});

const controlSchema = z.object({
  controlName: z.string().min(2),
  controlDescription: z.string().optional().nullable(),
  status: z.enum(['planned', 'implemented', 'partially_implemented']),
});

const riskSchema = z.object({
  riskId: z.string().min(2),
  title: z.string().min(2),
  description: z.string().min(5),
  assetId: z.string(),
  threatId: z.string().optional().nullable(),
  vulnerabilityId: z.string().optional().nullable(),
  inherentImpact: z.number().int().min(1).max(5),
  inherentLikelihood: z.number().int().min(1).max(5),
  residualImpact: z.number().int().min(1).max(5),
  residualLikelihood: z.number().int().min(1).max(5),
  treatmentStrategy: z.enum(['accept', 'mitigate', 'transfer', 'avoid']),
  riskOwnerId: z.string().optional().nullable(),
  status: z.enum(['identified', 'assessing', 'treating', 'accepted', 'mitigated', 'closed']),
  reviewDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  controls: z.array(controlSchema).default([]),
});

// 3. Create risk and linked controls (transaction-safe)
risksRouter.post('/', requireRole(['super_admin', 'ciso', 'risk_manager', 'risk_owner']), async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json();
  const result = riskSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const data = result.data;
  
  // Verify unique riskId
  const existing = await db.select().from(risks).where(eq(risks.riskId, data.riskId)).get();
  if (existing) {
    return c.json({ error: `Risk ID ${data.riskId} already exists` }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date();

  const inherentScore = data.inherentImpact * data.inherentLikelihood;
  const residualScore = data.residualImpact * data.residualLikelihood;

  try {
    // Run insertions inside a manual Drizzle batch / transaction representation
    await db.insert(risks).values({
      id,
      riskId: data.riskId,
      title: data.title,
      description: data.description,
      assetId: data.assetId,
      threatId: data.threatId || null,
      vulnerabilityId: data.vulnerabilityId || null,
      inherentImpact: data.inherentImpact,
      inherentLikelihood: data.inherentLikelihood,
      inherentScore,
      residualImpact: data.residualImpact,
      residualLikelihood: data.residualLikelihood,
      residualScore,
      treatmentStrategy: data.treatmentStrategy,
      riskOwnerId: data.riskOwnerId || null,
      status: data.status,
      reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    });

    if (data.controls && data.controls.length > 0) {
      for (const ctrl of data.controls) {
        await db.insert(riskControls).values({
          riskId: id,
          controlName: ctrl.controlName,
          controlDescription: ctrl.controlDescription || null,
          status: ctrl.status,
        });
      }
    }

    await logAuditAction(c, 'RISK_CREATE', { id, riskId: data.riskId, title: data.title });

    return c.json({ id, ...data, inherentScore, residualScore });

  } catch (err: any) {
    console.error('Failed to create risk:', err);
    return c.json({ error: `Database transaction error: ${err.message}` }, 500);
  }
});

// 4. Update risk and linked controls
risksRouter.put('/:id', requireRole(['super_admin', 'ciso', 'risk_manager', 'risk_owner']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = riskSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const existing = await db.select().from(risks).where(eq(risks.id, id)).get();
  if (!existing) {
    return c.json({ error: 'Risk not found' }, 404);
  }

  const data = result.data;
  const now = new Date();

  // If riskId changed, verify uniqueness
  if (data.riskId !== existing.riskId) {
    const duplicate = await db.select().from(risks).where(eq(risks.riskId, data.riskId)).get();
    if (duplicate) {
      return c.json({ error: `Risk ID ${data.riskId} already exists` }, 400);
    }
  }

  const inherentScore = data.inherentImpact * data.inherentLikelihood;
  const residualScore = data.residualImpact * data.residualLikelihood;

  try {
    // Update core risk fields
    await db.update(risks)
      .set({
        riskId: data.riskId,
        title: data.title,
        description: data.description,
        assetId: data.assetId,
        threatId: data.threatId || null,
        vulnerabilityId: data.vulnerabilityId || null,
        inherentImpact: data.inherentImpact,
        inherentLikelihood: data.inherentLikelihood,
        inherentScore,
        residualImpact: data.residualImpact,
        residualLikelihood: data.residualLikelihood,
        residualScore,
        treatmentStrategy: data.treatmentStrategy,
        riskOwnerId: data.riskOwnerId || null,
        status: data.status,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
        notes: data.notes || null,
        updatedAt: now,
      })
      .where(eq(risks.id, id));

    // Clear old controls mapping and rewrite
    await db.delete(riskControls).where(eq(riskControls.riskId, id));
    
    if (data.controls && data.controls.length > 0) {
      for (const ctrl of data.controls) {
        await db.insert(riskControls).values({
          riskId: id,
          controlName: ctrl.controlName,
          controlDescription: ctrl.controlDescription || null,
          status: ctrl.status,
        });
      }
    }

    await logAuditAction(c, 'RISK_UPDATE', { id, riskId: data.riskId, title: data.title });

    return c.json({ id, ...data, inherentScore, residualScore });

  } catch (err: any) {
    console.error('Failed to update risk:', err);
    return c.json({ error: `Database update error: ${err.message}` }, 500);
  }
});

// 5. Delete risk (Admin, CISO, Risk Manager only)
risksRouter.delete('/:id', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  const existing = await db.select().from(risks).where(eq(risks.id, id)).get();
  if (!existing) {
    return c.json({ error: 'Risk not found' }, 404);
  }

  await db.delete(risks).where(eq(risks.id, id));
  await logAuditAction(c, 'RISK_DELETE', { id, riskId: existing.riskId, title: existing.title });

  return c.json({ success: true });
});

export default risksRouter;
