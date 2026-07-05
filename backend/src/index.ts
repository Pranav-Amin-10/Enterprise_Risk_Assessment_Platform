import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import setupRouter from './routes/setup';
import authRouter from './routes/auth';
import orgsRouter from './routes/orgs';
import usersRouter from './routes/users';
import assetsRouter from './routes/assets';
import libraryRouter from './routes/library';
import risksRouter from './routes/risks';
import treatmentsRouter from './routes/treatments';
import dashboardRouter from './routes/dashboard';
import auditRouter from './routes/audit';
import evidenceRouter from './routes/evidence';
import notificationsRouter from './routes/notifications';
import type { Env, Variables } from './middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Enable CORS for frontend Vite development
app.use('*', cors({
  origin: (origin) => origin,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'Content-Disposition'],
  maxAge: 600,
  credentials: true,
}));

// Apply authentication middleware globally to all API paths
app.use('/api/*', authMiddleware());

// Mount Sub-routers
app.route('/api/setup', setupRouter);
app.route('/api/auth', authRouter);
app.route('/api/orgs', orgsRouter);
app.route('/api/users', usersRouter);
app.route('/api/assets', assetsRouter);
app.route('/api/library', libraryRouter);
app.route('/api/risks', risksRouter);
app.route('/api/treatments', treatmentsRouter);
app.route('/api/dashboard', dashboardRouter);
app.route('/api/audit', auditRouter);
app.route('/api/evidence', evidenceRouter);
app.route('/api/notifications', notificationsRouter);

// Global Error Handler
app.onError((err, c) => {
  console.error('Hono Global Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
  }, 500);
});

export default app;
