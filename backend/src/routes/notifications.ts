import { Hono } from 'hono';
import { getDb } from '../db';
import { notifications } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logAuditAction } from '../middleware/audit';
import type { Env, Variables } from '../middleware/auth';

const notificationsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 1. Get all notifications for the logged-in user
notificationsRouter.get('/', async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const list = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .all();

  return c.json(list);
});

// 2. Mark a notification as read
notificationsRouter.put('/:id/read', async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get('user');
  const id = c.req.param('id');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const existing = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
    .get();

  if (!existing) {
    return c.json({ error: 'Notification not found' }, 404);
  }

  await db.update(notifications)
    .set({ isRead: 1 })
    .where(eq(notifications.id, id));

  return c.json({ success: true });
});

// 3. Mark all notifications as read
notificationsRouter.post('/read-all', async (c) => {
  const db = getDb(c.env.DB);
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await db.update(notifications)
    .set({ isRead: 1 })
    .where(eq(notifications.userId, user.id));

  return c.json({ success: true });
});

export default notificationsRouter;
