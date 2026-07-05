import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '../db';
import { assets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import type { Env, Variables } from '../middleware/auth';

const assetsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 1. Get all assets
assetsRouter.get('/', async (c) => {
  const db = getDb(c.env.DB);
  const items = await db.select().from(assets).all();
  return c.json(items);
});

const assetSchema = z.object({
  assetId: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  type: z.enum([
    'server', 'application', 'api', 'database', 'endpoint', 
    'network_device', 'cloud_resource', 'business_process', 'sensitive_info'
  ]),
  businessOwnerId: z.string().optional().nullable(),
  technicalOwnerId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  criticality: z.enum(['low', 'medium', 'high', 'critical']),
  ciaConfidentiality: z.number().int().min(1).max(3),
  ciaIntegrity: z.number().int().min(1).max(3),
  ciaAvailability: z.number().int().min(1).max(3),
  assetValue: z.number().min(0),
  dataClassification: z.enum(['public', 'internal', 'confidential', 'restricted']),
  lifecycleStatus: z.enum(['active', 'retired', 'under_development']),
  tags: z.string().optional().nullable(),
  reviewDate: z.string().optional().nullable(), // ISO string from frontend
});

// 2. Create asset (Admins, CISO, Risk Manager, Asset Owner)
assetsRouter.post('/', requireRole(['super_admin', 'ciso', 'risk_manager', 'asset_owner']), async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json();
  const result = assetSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const data = result.data;
  
  // Check unique assetId
  const existing = await db.select().from(assets).where(eq(assets.assetId, data.assetId)).get();
  if (existing) {
    return c.json({ error: `Asset ID ${data.assetId} is already in use` }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(assets).values({
    id,
    assetId: data.assetId,
    name: data.name,
    description: data.description,
    type: data.type,
    businessOwnerId: data.businessOwnerId || null,
    technicalOwnerId: data.technicalOwnerId || null,
    departmentId: data.departmentId || null,
    criticality: data.criticality,
    ciaConfidentiality: data.ciaConfidentiality,
    ciaIntegrity: data.ciaIntegrity,
    ciaAvailability: data.ciaAvailability,
    assetValue: data.assetValue,
    dataClassification: data.dataClassification,
    lifecycleStatus: data.lifecycleStatus,
    tags: data.tags || null,
    reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
    createdAt: now,
    updatedAt: now,
  });

  await logAuditAction(c, 'ASSET_CREATE', { id, assetId: data.assetId, name: data.name });

  return c.json({ id, ...data });
});

// 3. Update asset (Admins, CISO, Risk Manager, Asset Owner)
assetsRouter.put('/:id', requireRole(['super_admin', 'ciso', 'risk_manager', 'asset_owner']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = assetSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const existing = await db.select().from(assets).where(eq(assets.id, id)).get();
  if (!existing) {
    return c.json({ error: 'Asset not found' }, 404);
  }

  const data = result.data;
  const now = new Date();

  // If assetId changed, make sure it is still unique
  if (data.assetId !== existing.assetId) {
    const duplicate = await db.select().from(assets).where(eq(assets.assetId, data.assetId)).get();
    if (duplicate) {
      return c.json({ error: `Asset ID ${data.assetId} is already in use` }, 400);
    }
  }

  await db.update(assets)
    .set({
      assetId: data.assetId,
      name: data.name,
      description: data.description,
      type: data.type,
      businessOwnerId: data.businessOwnerId || null,
      technicalOwnerId: data.technicalOwnerId || null,
      departmentId: data.departmentId || null,
      criticality: data.criticality,
      ciaConfidentiality: data.ciaConfidentiality,
      ciaIntegrity: data.ciaIntegrity,
      ciaAvailability: data.ciaAvailability,
      assetValue: data.assetValue,
      dataClassification: data.dataClassification,
      lifecycleStatus: data.lifecycleStatus,
      tags: data.tags || null,
      reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
      updatedAt: now,
    })
    .where(eq(assets.id, id));

  await logAuditAction(c, 'ASSET_UPDATE', { id, assetId: data.assetId, name: data.name });

  return c.json({ id, ...data });
});

// 4. Delete asset (Admins, CISO, Risk Manager only)
assetsRouter.delete('/:id', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  const existing = await db.select().from(assets).where(eq(assets.id, id)).get();
  if (!existing) {
    return c.json({ error: 'Asset not found' }, 404);
  }

  await db.delete(assets).where(eq(assets.id, id));

  await logAuditAction(c, 'ASSET_DELETE', { id, assetId: existing.assetId, name: existing.name });

  return c.json({ success: true });
});

export default assetsRouter;
