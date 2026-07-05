import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '../db';
import { organizations } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import type { Env, Variables } from '../middleware/auth';

const orgsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 1. Get all organizations (All authenticated roles can read)
orgsRouter.get('/', async (c) => {
  const db = getDb(c.env.DB);
  const items = await db.select().from(organizations).all();
  return c.json(items);
});

const orgSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['company', 'business_unit', 'department', 'team']),
  parentId: z.string().nullable().optional(),
  location: z.string().optional(),
});

// 2. Create organization (Super Admin, CISO, Risk Manager only)
orgsRouter.post('/', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json();
  const result = orgSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const { name, type, parentId, location } = result.data;
  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(organizations).values({
    id,
    name,
    type,
    parentId: parentId || null,
    location: location || null,
    createdAt: now,
    updatedAt: now,
  });

  await logAuditAction(c, 'ORG_CREATE', { id, name, type, parentId });

  return c.json({ id, name, type, parentId, location });
});

// 3. Update organization (Super Admin, CISO, Risk Manager only)
orgsRouter.put('/:id', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = orgSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const existing = await db.select().from(organizations).where(eq(organizations.id, id)).get();
  if (!existing) {
    return c.json({ error: 'Organization not found' }, 404);
  }

  const { name, type, parentId, location } = result.data;
  const now = new Date();

  await db.update(organizations)
    .set({
      name,
      type,
      parentId: parentId || null,
      location: location || null,
      updatedAt: now,
    })
    .where(eq(organizations.id, id));

  await logAuditAction(c, 'ORG_UPDATE', { id, name, type, parentId });

  return c.json({ id, name, type, parentId, location });
});

// 4. Delete organization (Super Admin only)
orgsRouter.delete('/:id', requireRole(['super_admin']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  const existing = await db.select().from(organizations).where(eq(organizations.id, id)).get();
  if (!existing) {
    return c.json({ error: 'Organization not found' }, 404);
  }

  // Prevent deleting root company node if it is the only company node
  if (existing.type === 'company') {
    const companies = await db.select().from(organizations).where(eq(organizations.type, 'company')).all();
    if (companies.length <= 1) {
      return c.json({ error: 'Forbidden: Cannot delete the only root company node' }, 403);
    }
  }

  await db.delete(organizations).where(eq(organizations.id, id));

  await logAuditAction(c, 'ORG_DELETE', { id, name: existing.name, type: existing.type });

  return c.json({ success: true });
});

export default orgsRouter;
