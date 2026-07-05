# Database Schema & Relations

The platform stores all metadata and relation maps inside a Cloudflare D1 SQLite relational database. Schemes are defined and managed using Drizzle ORM.

---

## 1. Schema Diagram Relations

```
[ users ] 
    │  (1-to-many)
    ├─► [ assets.businessOwnerId ]
    ├─► [ assets.technicalOwnerId ]
    ├─► [ risks.riskOwnerId ]
    ├─► [ treatments.ownerId ]
    └─► [ notifications.userId ]

[ organizations ]
    │  (self-reference parentId hierarchy)
    └─► [ assets.departmentId ]

[ assets ] 
    │  (1-to-many)
    └─► [ risks.assetId ]

[ threats ] ──────────► [ risks.threatId ]
[ vulnerabilities ] ──► [ risks.vulnerabilityId ]

[ risks ]
    ├─► [ risk_controls ] (1-to-many composite primary keys)
    ├─► [ treatments ] (1-to-1 unique mapping)
    └─► [ evidence.riskId ] (1-to-many files)
```

---

## 2. Table Column Mappings

### `users`
* `id` (`TEXT`): Firebase UID hash serving as primary key.
* `email` (`TEXT`): Unique corporate address, indexed to optimize claiming queries.
* `role` (`TEXT`): Restricted via Check constraint: `'super_admin'`, `'ciso'`, `'risk_manager'`, `'auditor'`, `'asset_owner'`, `'risk_owner'`, `'department_head'`, `'viewer'`.
* `status` (`TEXT`): `'active'`, `'locked'`, `'pending'`.
* `createdAt` / `updatedAt` (`INTEGER`): Unix epoch millisecond timestamps.

### `risks`
* `id` (`TEXT`): UUID primary key.
* `riskId` (`TEXT`): Unique, human-readable identifier (e.g. `RSK-001`), indexed.
* `assetId` (`TEXT`): Foreign key referencing `assets.id` ON DELETE CASCADE.
* `inherentScore` (`INTEGER`): Programmatically calculated index `inherentImpact * inherentLikelihood` (Scale: 1 to 25).
* `residualScore` (`INTEGER`): Mapped mitigation index `residualImpact * residualLikelihood` (Scale: 1 to 25).

### `audit_logs`
* `id` (`TEXT`): UUID primary key.
* `userId` (`TEXT`): Author UID.
* `userEmail` (`TEXT`): Author email.
* `action` (`TEXT`): Operational event (e.g. `RISK_DELETE`, `ORG_CREATE`).
* `details` (`TEXT`): Raw JSON string serialization.
* `ipAddress` (`TEXT`): Remote client IP recorded during Hono interception.
* `createdAt` (`INTEGER`): Epoch timestamp. *No update/delete endpoints exist for this table, making it immutable.*

### `evidence`
* `id` (`TEXT`): UUID primary key.
* `name` (`TEXT`): Original uploaded filename.
* `filePath` (`TEXT`): Reference path token.
* `fileData` (`TEXT`): Base64 encoded file binary contents.
* `fileSize` (`INTEGER`): File size in bytes.
* `mimeType` (`TEXT`): File content type (e.g. `application/pdf`).
* `riskId` / `assetId` / `treatmentId` (`TEXT`): Relation reference foreign keys.
