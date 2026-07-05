import { getDb } from '../db';
import { auditLogs } from '../db/schema';

/**
 * Inserts an immutable audit log entry into the D1 database.
 * Logs the acting user, operational action, details, IP address, and timestamp.
 */
export async function logAuditAction(
  c: any,
  action: string,
  details: Record<string, any>
): Promise<void> {
  try {
    const user = c.get('user');
    const firebaseEmail = c.get('firebaseEmail');
    const firebaseUid = c.get('firebaseUid');
    
    const db = getDb(c.env.DB);
    
    // Cloudflare edge headers for source IP address
    const ipAddress = 
      c.req.header('CF-Connecting-IP') || 
      c.req.header('X-Real-IP') || 
      c.req.header('X-Forwarded-For') || 
      '127.0.0.1';
    
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: user?.id || firebaseUid || 'unregistered',
      userEmail: user?.email || firebaseEmail || 'unknown@platform.local',
      action,
      details: JSON.stringify(details),
      ipAddress,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('Audit Logging Failed:', err);
    // Do not throw to avoid crashing the operational request
  }
}
