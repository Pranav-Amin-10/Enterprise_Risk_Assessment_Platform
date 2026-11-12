import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { MiddlewareHandler } from 'hono';
import { getDb } from '../db';
import { users, organizations, threats, vulnerabilities } from '../db/schema';
import { defaultThreats, defaultVulnerabilities } from '../db/seedData';
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
      
      // 3. If not found by UID, perform Registration Claiming check by email (case-insensitive)
      if (!dbUser) {
        const dbUserByEmail = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
        if (dbUserByEmail) {
          // Bind the Firebase UID to the existing pre-created D1 record
          await db.update(users)
            .set({ id: uid, status: 'active', updatedAt: new Date() })
            .where(eq(users.email, email.toLowerCase()));
          
          // Re-query to confirm update
          dbUser = await db.select().from(users).where(eq(users.id, uid)).get();
        }
      }

      // 4. AUTO-BOOTSTRAP FIRST USER:
      // If the D1 database currently has 0 users, automatically register this first authenticated Firebase user as Super Admin!
      if (!dbUser) {
        const existingUsers = await db.select({ id: users.id }).from(users).all();
        if (existingUsers.length === 0) {
          const now = new Date();
          const adminName = (payload.name as string) || email.split('@')[0] || 'Super Admin';
          
          await db.insert(users).values({
            id: uid,
            email: email.toLowerCase(),
            name: adminName,
            role: 'super_admin',
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });

          // Ensure base company organization exists
          const existingOrgs = await db.select({ id: organizations.id }).from(organizations).all();
          if (existingOrgs.length === 0) {
            await db.insert(organizations).values({
              id: crypto.randomUUID(),
              name: 'Enterprise Organization',
              type: 'company',
              location: 'Headquarters',
              createdAt: now,
              updatedAt: now,
            });
          }

          // Seed default threats
          const existingThreats = await db.select({ id: threats.id }).from(threats).all();
          if (existingThreats.length === 0) {
            for (const t of defaultThreats) {
              await db.insert(threats).values({
                id: crypto.randomUUID(),
                threatId: t.threatId,
                name: t.name,
                description: t.description,
                category: t.category,
                isCustom: t.isCustom,
                createdAt: now,
              });
            }
          }

          // Seed default vulnerabilities
          const existingVulns = await db.select({ id: vulnerabilities.id }).from(vulnerabilities).all();
          if (existingVulns.length === 0) {
            for (const v of defaultVulnerabilities) {
              await db.insert(vulnerabilities).values({
                id: crypto.randomUUID(),
                vulnId: v.vulnId,
                name: v.name,
                description: v.description,
                severity: v.severity,
                isCustom: v.isCustom,
                createdAt: now,
              });
            }
          }

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