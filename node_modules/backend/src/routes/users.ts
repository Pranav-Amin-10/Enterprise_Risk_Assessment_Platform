import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '../db';
import { users } from '../db/schema';
import { eq, ne } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import type { Env, Variables } from '../middleware/auth';

const usersRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 1. Get all users (Super Admin, CISO, Auditor, Risk Manager only)
usersRouter.get('/', requireRole(['super_admin', 'ciso', 'auditor', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const items = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    status: users.status,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  }).from(users).all();
  return c.json(items);
});

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['super_admin', 'ciso', 'risk_manager', 'auditor', 'asset_owner', 'risk_owner', 'department_head', 'viewer']),
  status: z.enum(['active', 'locked', 'pending']).default('pending'),
});

// 2. Pre-register a new user (Super Admin, CISO, Risk Manager only)
usersRouter.post('/', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json();
  const result = createUserSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const { email, name, role, status } = result.data;
  
  // Check if email already registered
  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existing) {
    return c.json({ error: 'Email already registered' }, 400);
  }

  // Use a temporary UUID which will be claimed and replaced by the actual Firebase UID on first login
  const tempId = `temp_${crypto.randomUUID()}`;
  const now = new Date();

  await db.insert(users).values({
    id: tempId,
    email: email.toLowerCase(),
    name,
    role,
    status,
    createdAt: now,
    updatedAt: now,
  });

  await logAuditAction(c, 'USER_REGISTER', { email, name, role, status });

  return c.json({ id: tempId, email, name, role, status });
});

const updateUserSchema = z.object({
  name: z.string().min(2),
  role: z.enum(['super_admin', 'ciso', 'risk_manager', 'auditor', 'asset_owner', 'risk_owner', 'department_head', 'viewer']),
  status: z.enum(['active', 'locked', 'pending']),
});

// 3. Update a user's details (Super Admin, CISO only)
usersRouter.put('/:id', requireRole(['super_admin', 'ciso']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = updateUserSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
  }

  const existing = await db.select().from(users).where(eq(users.id, id)).get();
  if (!existing) {
    return c.json({ error: 'User not found' }, 404);
  }

  const actingUser = c.get('user');
  // Prevent locking oneself out or demoting oneself
  if (actingUser && actingUser.id === id) {
    if (result.data.role !== existing.role || result.data.status !== 'active') {
      return c.json({ error: 'Forbidden: Cannot demote or lock your own user account' }, 403);
    }
  }

  const { name, role, status } = result.data;
  const now = new Date();

  await db.update(users)
    .set({
      name,
      role,
      status,
      updatedAt: now,
    })
    .where(eq(users.id, id));

  await logAuditAction(c, 'USER_UPDATE', { id, email: existing.email, role, status });

  return c.json({ id, email: existing.email, name, role, status });
});

// 4. Delete user (Super Admin only)
usersRouter.delete('/:id', requireRole(['super_admin']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  const existing = await db.select().from(users).where(eq(users.id, id)).get();
  if (!existing) {
    return c.json({ error: 'User not found' }, 404);
  }

  const actingUser = c.get('user');
  if (actingUser && actingUser.id === id) {
    return c.json({ error: 'Forbidden: Cannot delete your own user account' }, 403);
  }

  await db.delete(users).where(eq(users.id, id));

  await logAuditAction(c, 'USER_DELETE', { id, email: existing.email });

  return c.json({ success: true });
});

export default usersRouter;
