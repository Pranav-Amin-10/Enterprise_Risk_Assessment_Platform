import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { MiddlewareHandler } from 'hono';
import { getDb } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  FIREBASE_PROJECT_ID: string;
}

export type Variables = {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'super_admin' | 'ciso' | 'risk_manager' | 'auditor' | 'asset_owner' | 'risk_owner' | 'department_head' | 'viewer';
    status: 'active' | 'locked' | 'pending';
  };
  firebaseUid?: string;
  firebaseEmail?: string;
};

// URL for Google's Firebase Auth public keys
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export const authMiddleware = (): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> => {
  return async (c, next) => {
    const path = c.req.path;
    
    // 1. Bypass auth check completely for setup check
    if (path === '/api/setup/check') {
      return await next();
    }
    
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: Missing or malformed token' }, 401);
    }
    
    const token = authHeader.substring(7);
    const projectId = c.env.FIREBASE_PROJECT_ID;
    
    try {
      // Verify signature, audience, and issuer
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      });
      
      const uid = payload.sub;
      const email = payload.email as string;
      
      if (!uid || !email) {
        return c.json({ error: 'Unauthorized: Invalid token claims' }, 401);
      }
      
      c.set('firebaseUid', uid);
      c.set('firebaseEmail', email);
      
      const db = getDb(c.env.DB);
      
      // 2. Look up user by UID (standard session check)
      let dbUser = await db.select().from(users).where(eq(users.id, uid)).get();
      
      // 3. If not found by UID, perform Registration Claiming check by email
      if (!dbUser) {
        const dbUserByEmail = await db.select().from(users).where(eq(users.email, email)).get();
        if (dbUserByEmail) {
          // Bind the Firebase UID to the existing pre-created D1 record
          await db.update(users)
            .set({ id: uid, status: 'active', updatedAt: new Date() })
            .where(eq(users.email, email));
          
          // Re-query to confirm update
          dbUser = await db.select().from(users).where(eq(users.id, uid)).get();
        }
      }
      
      if (dbUser) {
        if (dbUser.status === 'locked') {
          return c.json({ error: 'Forbidden: Account is locked' }, 403);
        }
        
        c.set('user', {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role as any,
          status: dbUser.status as any,
        });
      } else {
        // Bypass D1 lookup check only for bootstrap setup route
        if (path === '/api/setup/bootstrap') {
          return await next();
        }
        return c.json({ error: 'Unauthorized: User profile not registered in GRC D1 database' }, 401);
      }
      
      await next();
    } catch (err: any) {
      console.error('JWT Verification Error:', err);
      return c.json({ error: `Unauthorized: Token verification failed: ${err.message}` }, 401);
    }
  };
};

// RBAC Middleware Helper
export const requireRole = (allowedRoles: string[]): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> => {
  return async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: 'Forbidden: Insufficient privileges' }, 403);
    }
    
    await next();
  };
};
