import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '../db';
import { threats, vulnerabilities } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import type { Env, Variables } from '../middleware/auth';

const libraryRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// --- Threats Section ---

// 1. Get all threats
libraryRouter.get('/threats', async (c) => {
  const db = getDb(c.env.DB);
  const items = await db.select().from(threats).all();
  return c.json(items);
});

const threatSchema = z.object({
  threatId: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  category: z.string().min(2),
});

// 2. Create custom threat (Admin, CISO, Risk Manager only)
libraryRouter.post('/threats', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json();
  const result = threatSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const { threatId, name, description, category } = result.data;
  
  // Check unique threatId
  const existing = await db.select().from(threats).where(eq(threats.threatId, threatId)).get();
  if (existing) {
    return c.json({ error: `Threat ID ${threatId} already exists` }, 400);
  }

  const id = crypto.randomUUID();
  await db.insert(threats).values({
    id,
    threatId,
    name,
    description,
    category,
    isCustom: 1, // Custom threat
    createdAt: new Date(),
  });

  await logAuditAction(c, 'THREAT_CREATE', { id, threatId, name });

  return c.json({ id, threatId, name, description, category, isCustom: 1 });
});

// 3. Delete custom threat (Admin, CISO, Risk Manager only)
libraryRouter.delete('/threats/:id', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  const existing = await db.select().from(threats).where(eq(threats.id, id)).get();
  if (!existing) {
    return c.json({ error: 'Threat not found' }, 404);
  }

  if (existing.isCustom === 0) {
    return c.json({ error: 'Forbidden: Cannot delete system threat definitions' }, 403);
  }

  await db.delete(threats).where(eq(threats.id, id));
  await logAuditAction(c, 'THREAT_DELETE', { id, threatId: existing.threatId, name: existing.name });

  return c.json({ success: true });
});


// --- Vulnerabilities Section ---

// 4. Get all vulnerabilities
libraryRouter.get('/vulnerabilities', async (c) => {
  const db = getDb(c.env.DB);
  const items = await db.select().from(vulnerabilities).all();
  return c.json(items);
});

const vulnSchema = z.object({
  vulnId: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

// 5. Create custom vulnerability (Admin, CISO, Risk Manager only)
libraryRouter.post('/vulnerabilities', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json();
  const result = vulnSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const { vulnId, name, description, severity } = result.data;
  
  // Check unique vulnId
  const existing = await db.select().from(vulnerabilities).where(eq(vulnerabilities.vulnId, vulnId)).get();
  if (existing) {
    return c.json({ error: `Vulnerability ID ${vulnId} already exists` }, 400);
  }

  const id = crypto.randomUUID();
  await db.insert(vulnerabilities).values({
    id,
    vulnId,
    name,
    description,
    severity,
    isCustom: 1, // Custom
    createdAt: new Date(),
  });

  await logAuditAction(c, 'VULN_CREATE', { id, vulnId, name });

  return c.json({ id, vulnId, name, description, severity, isCustom: 1 });
});

// 6. Delete custom vulnerability (Admin, CISO, Risk Manager only)
libraryRouter.delete('/vulnerabilities/:id', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  const existing = await db.select().from(vulnerabilities).where(eq(vulnerabilities.id, id)).get();
  if (!existing) {
    return c.json({ error: 'Vulnerability not found' }, 404);
  }

  if (existing.isCustom === 0) {
    return c.json({ error: 'Forbidden: Cannot delete system vulnerability definitions' }, 403);
  }

  await db.delete(vulnerabilities).where(eq(vulnerabilities.id, id));
  await logAuditAction(c, 'VULN_DELETE', { id, vulnId: existing.vulnId, name: existing.name });

  return c.json({ success: true });
});

export default libraryRouter;
