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

    // Upload to Cloudflare R2 Bucket
    const fileBuffer = await file.arrayBuffer();
    await c.env.BUCKET.put(objectKey, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `attachment; filename="${cleanFileName}"`,
      },
      customMetadata: {
        uploadedBy: user.email,
        originalName: file.name,
      }
    });

    // Write file metadata to D1 DB
    await db.insert(evidence).values({
      id,
      name: file.name,
      filePath: objectKey,
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
    if (!meta) {
      return c.json({ error: 'Evidence record not found' }, 404);
    }

    // Fetch from R2 Bucket
    const fileObject = await c.env.BUCKET.get(meta.filePath);
    if (!fileObject) {
      return c.json({ error: 'File data not found in object storage' }, 404);
    }

    const fileHeaders = new Headers();
    fileHeaders.set('Content-Type', meta.mimeType || 'application/octet-stream');
    fileHeaders.set('Content-Disposition', `attachment; filename="${meta.name}"`);
    fileHeaders.set('Content-Length', meta.fileSize.toString());

    return c.body(fileObject.body, 200, fileHeaders);

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
    let query = db.select().from(evidence);
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

    // Delete from R2
    await c.env.BUCKET.delete(meta.filePath);

    // Delete from D1 DB
    await db.delete(evidence).where(eq(evidence.id, id));

    await logAuditAction(c, 'FILE_DELETE', { id, fileName: meta.name });

    return c.json({ success: true });
  } catch (err: any) {
    console.error('File delete error:', err);
    return c.json({ error: `Delete failed: ${err.message}` }, 500);
  }
});

export default evidenceRouter;
