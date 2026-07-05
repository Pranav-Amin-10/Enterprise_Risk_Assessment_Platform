import { Hono } from 'hono';
import type { Env, Variables } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';

const authRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get logged-in user profile from D1
authRouter.get('/me', async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized: User profile not registered' }, 401);
  }

  // Log active user session verify
  await logAuditAction(c, 'USER_SESSION_VERIFY', {
    userId: user.id,
    userEmail: user.email,
  });

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  });
});

export default authRouter;
