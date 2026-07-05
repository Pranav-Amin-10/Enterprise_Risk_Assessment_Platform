import { Hono } from 'hono';
import { getDb } from '../db';
import { evidence, risks, assets, treatments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logAuditAction } from '../middleware/audit';
import { requireRole } from '../middleware/auth';
import type { Env, Variables } from '../middleware/auth';

const evidenceRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 1. Upload evidence document (5MB Limit)
evidenceRouter.post('/upload', requireRole(['super_admin', 'ciso', 'risk_manager', 'risk_owner', 'asset_owner']), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const formData = await c.req.parseBody();
    const file = formData.file;
    const riskId = formData.riskId as string | undefined;
    const assetId = formData.assetId as string | undefined;
    const treatmentId = formData.treatmentId as string | undefined;

    if (!file || typeof file === 'string') {
      return c.json({ error: 'Bad Request: No file attached' }, 400);
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit
    if (file.size > maxSizeBytes) {
      return c.json({ error: 'Payload Too Large: File size exceeds 5MB limit' }, 413);
    }

    const db = getDb(c.env.DB);
    const id = crypto.randomUUID();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const objectKey = `evidence/${id}_${cleanFileName}`;

    // Read file binary array buffer and encode to Base64 (safe for SQLite TEXT column)
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Data = btoa(binary);

    // Write file metadata and base64 data to D1 DB
    await db.insert(evidence).values({
      id,
      name: file.name,
      filePath: objectKey,
      fileData: base64Data,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: user.id,
      riskId: riskId || null,
      assetId: assetId || null,
      treatmentId: treatmentId || null,
      createdAt: new Date(),
    });

    await logAuditAction(c, 'FILE_UPLOAD', { id, fileName: file.name, size: file.size });

    return c.json({
      id,
      name: file.name,
      size: file.size,
      mimeType: file.type,
    });

  } catch (err: any) {
    console.error('File upload error:', err);
    return c.json({ error: `Upload failed: ${err.message}` }, 500);
  }
});

// 2. Download evidence file
evidenceRouter.get('/:id/download', async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  try {
    const meta = await db.select().from(evidence).where(eq(evidence.id, id)).get();
    if (!meta || !meta.fileData) {
      return c.json({ error: 'Evidence record not found' }, 404);
    }

    // Decode Base64 string back to binary Uint8Array
    const binaryString = atob(meta.fileData);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileHeaders = new Headers();
    fileHeaders.set('Content-Type', meta.mimeType || 'application/octet-stream');
    fileHeaders.set('Content-Disposition', `attachment; filename="${meta.name}"`);
    fileHeaders.set('Content-Length', meta.fileSize.toString());

    return c.body(bytes, 200, fileHeaders);

  } catch (err: any) {
    console.error('File download error:', err);
    return c.json({ error: `Download failed: ${err.message}` }, 500);
  }
});

// 3. List evidence linked to a specific entity
evidenceRouter.get('/linked', async (c) => {
  const db = getDb(c.env.DB);
  const riskId = c.req.query('riskId');
  const assetId = c.req.query('assetId');
  const treatmentId = c.req.query('treatmentId');

  try {
    let query = db.select({
      id: evidence.id,
      name: evidence.name,
      filePath: evidence.filePath,
      fileSize: evidence.fileSize,
      mimeType: evidence.mimeType,
      uploadedBy: evidence.uploadedBy,
      riskId: evidence.riskId,
      assetId: evidence.assetId,
      treatmentId: evidence.treatmentId,
      createdAt: evidence.createdAt,
    }).from(evidence); // Project columns omitting the heavy fileData string for listing speed
    
    let items = [];

    if (riskId) {
      items = await query.where(eq(evidence.riskId, riskId)).all();
    } else if (assetId) {
      items = await query.where(eq(evidence.assetId, assetId)).all();
    } else if (treatmentId) {
      items = await query.where(eq(evidence.treatmentId, treatmentId)).all();
    } else {
      return c.json({ error: 'Bad Request: Missing entity query param' }, 400);
    }

    return c.json(items);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 4. Delete evidence file (Admin, CISO, Risk Manager only)
evidenceRouter.delete('/:id', requireRole(['super_admin', 'ciso', 'risk_manager']), async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  try {
    const meta = await db.select().from(evidence).where(eq(evidence.id, id)).get();
    if (!meta) {
      return c.json({ error: 'Evidence record not found' }, 404);
    }

    // Delete from D1 DB (automatically deletes data column)
    await db.delete(evidence).where(eq(evidence.id, id));

    await logAuditAction(c, 'FILE_DELETE', { id, fileName: meta.name });

    return c.json({ success: true });
  } catch (err: any) {
    console.error('File delete error:', err);
    return c.json({ error: `Delete failed: ${err.message}` }, 500);
  }
});

export default evidenceRouter;
