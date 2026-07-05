import { Hono } from 'hono';
import { getDb } from '../db';
import { auditLogs } from '../db/schema';
import { desc } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';
import type { Env, Variables } from '../middleware/auth';

const auditRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get list of audit logs (Super Admin, CISO, Auditor only)
auditRouter.get('/', requireRole(['super_admin', 'ciso', 'auditor']), async (c) => {
  const db = getDb(c.env.DB);
  
  try {
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(200) // Caps log query for performance, return recent entries
      .all();

    return c.json(logs);
  } catch (err: any) {
    console.error('Fetch audit logs error:', err);
    return c.json({ error: err.message }, 500);
  }
});

export default auditRouter;
