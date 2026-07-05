import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

// Users table (Mapped to Firebase UIDs)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Firebase UID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { 
    enum: ['super_admin', 'ciso', 'risk_manager', 'auditor', 'asset_owner', 'risk_owner', 'department_head', 'viewer'] 
  }).notNull().default('viewer'),
  status: text('status', { enum: ['active', 'locked', 'pending'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Organizations (Company, Business Unit, Department, Team hierarchy)
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  type: text('type', { enum: ['company', 'business_unit', 'department', 'team'] }).notNull(),
  parentId: text('parent_id'), // Self-reference for hierarchical structure
  location: text('location'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// User-Organization membership (Mapping table)
export const userOrganizations = sqliteTable('user_organizations', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.organizationId] }),
}));

// Assets Table
export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(), // UUID
  assetId: text('asset_id').notNull().unique(), // e.g. AST-001
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { 
    enum: ['server', 'application', 'api', 'database', 'endpoint', 'network_device', 'cloud_resource', 'business_process', 'sensitive_info'] 
  }).notNull(),
  businessOwnerId: text('business_owner_id').references(() => users.id, { onDelete: 'set null' }),
  technicalOwnerId: text('technical_owner_id').references(() => users.id, { onDelete: 'set null' }),
  departmentId: text('department_id').references(() => organizations.id, { onDelete: 'set null' }),
  criticality: text('criticality', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('low'),
  ciaConfidentiality: integer('cia_confidentiality').notNull().default(1), // 1 to 3
  ciaIntegrity: integer('cia_integrity').notNull().default(1), // 1 to 3
  ciaAvailability: integer('cia_availability').notNull().default(1), // 1 to 3
  assetValue: real('asset_value').notNull().default(0.0),
  dataClassification: text('data_classification', { 
    enum: ['public', 'internal', 'confidential', 'restricted'] 
  }).notNull().default('internal'),
  lifecycleStatus: text('lifecycle_status', { 
    enum: ['active', 'retired', 'under_development'] 
  }).notNull().default('active'),
  tags: text('tags'), // Comma separated or JSON string
  reviewDate: integer('review_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Threats Library
export const threats = sqliteTable('threats', {
  id: text('id').primaryKey(),
  threatId: text('threat_id').notNull().unique(), // e.g. THR-001
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  isCustom: integer('is_custom').notNull().default(0), // 0 or 1
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Vulnerabilities Library
export const vulnerabilities = sqliteTable('vulnerabilities', {
  id: text('id').primaryKey(),
  vulnId: text('vuln_id').notNull().unique(), // e.g. VUL-001
  name: text('name').notNull(),
  description: text('description'),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('low'),
  isCustom: integer('is_custom').notNull().default(0), // 0 or 1
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Risks Table
export const risks = sqliteTable('risks', {
  id: text('id').primaryKey(),
  riskId: text('risk_id').notNull().unique(), // e.g. RSK-001
  title: text('title').notNull(),
  description: text('description').notNull(),
  assetId: text('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  threatId: text('threat_id').references(() => threats.id, { onDelete: 'set null' }),
  vulnerabilityId: text('vulnerability_id').references(() => vulnerabilities.id, { onDelete: 'set null' }),
  
  // Scoring parameters (1 to 5)
  inherentImpact: integer('inherent_impact').notNull().default(1),
  inherentLikelihood: integer('inherent_likelihood').notNull().default(1),
  inherentScore: integer('inherent_score').notNull().default(1), // Impact * Likelihood

  residualImpact: integer('residual_impact').notNull().default(1),
  residualLikelihood: integer('residual_likelihood').notNull().default(1),
  residualScore: integer('residual_score').notNull().default(1), // Impact * Likelihood

  treatmentStrategy: text('treatment_strategy', { 
    enum: ['accept', 'mitigate', 'transfer', 'avoid'] 
  }).notNull().default('mitigate'),
  
  riskOwnerId: text('risk_owner_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status', { 
    enum: ['identified', 'assessing', 'treating', 'accepted', 'mitigated', 'closed'] 
  }).notNull().default('identified'),
  
  reviewDate: integer('review_date', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Controls linked to Risks (Existing Controls or Applied Mitigations)
export const riskControls = sqliteTable('risk_controls', {
  riskId: text('risk_id').notNull().references(() => risks.id, { onDelete: 'cascade' }),
  controlName: text('control_name').notNull(),
  controlDescription: text('control_description'),
  status: text('status', { enum: ['planned', 'implemented', 'partially_implemented'] }).notNull().default('implemented'),
}, (table) => ({
  pk: primaryKey({ columns: [table.riskId, table.controlName] }),
}));

// Risk Treatments Detail Table
export const treatments = sqliteTable('treatments', {
  id: text('id').primaryKey(),
  riskId: text('risk_id').notNull().unique().references(() => risks.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
  budget: real('budget').notNull().default(0.0),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  progressPercent: integer('progress_percent').notNull().default(0), // 0 to 100
  status: text('status', { enum: ['planned', 'in_progress', 'completed', 'deferred'] }).notNull().default('planned'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Attached Files (Evidence store metadata and data stored in D1)
export const evidence = sqliteTable('evidence', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(), // kept as reference path name
  fileData: text('file_data').notNull(), // Base64 encoded file data
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  riskId: text('risk_id').references(() => risks.id, { onDelete: 'set null' }),
  assetId: text('asset_id').references(() => assets.id, { onDelete: 'set null' }),
  treatmentId: text('treatment_id').references(() => treatments.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Audit Log (Immutable append-only ledger)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  userEmail: text('user_email').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(), // JSON serialized
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// In-App Notifications
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { 
    enum: ['risk_review', 'treatment_due', 'asset_review', 'system_alert', 'new_risk_assigned'] 
  }).notNull(),
  isRead: integer('is_read').notNull().default(0), // 0 or 1
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
