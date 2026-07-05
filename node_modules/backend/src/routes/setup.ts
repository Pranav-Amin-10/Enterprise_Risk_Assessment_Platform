import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '../db';
import { users, organizations, threats, vulnerabilities } from '../db/schema';
import { logAuditAction } from '../middleware/audit';
import { defaultThreats, defaultVulnerabilities } from '../db/seedData';
import type { Env, Variables } from '../middleware/auth';

const setupRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 1. Check if database setup is required (no users in database)
setupRouter.get('/check', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const userCount = await db.select({ id: users.id }).from(users).all();
    if (userCount.length === 0) {
      return c.json({ needsSetup: true });
    }
    return c.json({ needsSetup: false });
  } catch (err: any) {
    // If table doesn't exist, we probably need migrations first
    console.error('Setup check DB error:', err);
    return c.json({ needsSetup: true, error: 'Database schema not initialized. Run migrations first.' });
  }
});

const bootstrapSchema = z.object({
  name: z.string().min(2),
  companyName: z.string().min(2),
  location: z.string().optional(),
});

// 2. Perform the first-time bootstrap setup
setupRouter.post('/bootstrap', async (c) => {
  const db = getDb(c.env.DB);
  const firebaseUid = c.get('firebaseUid');
  const firebaseEmail = c.get('firebaseEmail');
  
  if (!firebaseUid || !firebaseEmail) {
    return c.json({ error: 'Unauthorized: Firebase Token missing during bootstrap' }, 401);
  }

  try {
    // Prevent bootstrapping if any user already exists
    const existingUsers = await db.select().from(users).all();
    if (existingUsers.length > 0) {
      return c.json({ error: 'Bad Request: Platform is already bootstrapped' }, 400);
    }

    const body = await c.req.json();
    const result = bootstrapSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: 'Validation Error', details: result.error.format() }, 400);
    }

    const { name, companyName, location } = result.data;
    const now = new Date();

    // 1. Create Super Admin User
    await db.insert(users).values({
      id: firebaseUid,
      email: firebaseEmail,
      name,
      role: 'super_admin',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    // 2. Create Core Company Organization
    const companyId = crypto.randomUUID();
    await db.insert(organizations).values({
      id: companyId,
      name: companyName,
      type: 'company',
      parentId: null,
      location: location || 'Headquarters',
      createdAt: now,
      updatedAt: now,
    });

    // 3. Seed Default Threat Library
    for (const threat of defaultThreats) {
      await db.insert(threats).values({
        id: crypto.randomUUID(),
        threatId: threat.threatId,
        name: threat.name,
        description: threat.description,
        category: threat.category,
        isCustom: threat.isCustom,
        createdAt: now,
      });
    }

    // 4. Seed Default Vulnerability Library
    for (const vuln of defaultVulnerabilities) {
      await db.insert(vulnerabilities).values({
        id: crypto.randomUUID(),
        vulnId: vuln.vulnId,
        name: vuln.name,
        description: vuln.description,
        severity: vuln.severity,
        isCustom: vuln.isCustom,
        createdAt: now,
      });
    }

    // 5. Log bootstrap action in audit system
    await logAuditAction(c, 'SYSTEM_BOOTSTRAP', {
      adminEmail: firebaseEmail,
      adminName: name,
      companyName,
      location,
    });

    return c.json({
      success: true,
      message: 'System bootstrapped successfully',
      user: {
        id: firebaseUid,
        email: firebaseEmail,
        name,
        role: 'super_admin',
      },
    });

  } catch (err: any) {
    console.error('Bootstrap failed:', err);
    return c.json({ error: `Internal Server Error: ${err.message}` }, 500);
  }
});

export default setupRouter;
