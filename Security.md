# GRC Platform Security Architecture

Aegis GRC incorporates secure-by-design mechanisms aligned with OWASP ASVS guidelines to safeguard sensitive corporate Governance, Risk, and Compliance data. 

This document explains the security controls, authentication protocols, and authorization models implemented on the platform.

---

## 🔒 1. Authentication & Token Verification
* **JWKS Verification at the Edge:** Aegis GRC uses stateless edge token checking. The Hono worker decodes the JWT headers passed in the authorization header and queries Google's public JSON Web Key Sets (JWKS) to verify the token signature. This prevents token-tampering and key-spoofing attacks.
* **Firebase Security Integration:** Passwords, registrations, and account recovery flows are managed securely by the Firebase Client SDK, removing the risk of credential leakage from the core database.
* **Session Expiry Compliance:** Tokens are validated in real time against key constraints, forcing automatic re-authentications during token expirations or account lockouts.

---

## 🧭 2. Authorization (Role-Based Access Control)

Endpoints and user interface buttons are restricted based on user roles to enforce strict "Segregation of Duties" compliance:

| Role | Read Register | Create / Edit Risks | Approve Risk Acceptances | Alter Assets | Provision Users | View Audit History |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CISO** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Risk Manager** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Auditor** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Asset Owner** | ✅ | ❌ | ❌ | ✅ (Own) | ❌ | ❌ |
| **Risk Owner** | ✅ | ✅ (Own) | ❌ | ❌ | ❌ | ❌ |
| **Department Head** | ✅ (Dept) | ❌ | ❌ | ✅ (Dept) | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 📂 3. Department Data Scoping (Multi-Tenancy Isolation)

Aegis GRC includes dynamic data scoping to restrict data access:
* **Scope Evaluation:** When a user with the **Department Head** role logs in, the API fetches their profile and identifies their assigned department scope (e.g., *Cloud Infrastructure*).
* **Asset & Risk Filtering:** All database fetch queries automatically inject an SQL `WHERE` filter matching their assigned department ID.
* **Data Isolation:** Department Heads cannot query, update, or delete assets or risks belonging to other divisions. Dashboard metrics, average risk scores, heatmaps, and export reports are compiled dynamically from their scoped database subset.

---

## 🛡️ 4. Security Controls & Threat Mitigations

### SQL Injection Prevention
* The platform does not use raw string interpolations in database queries. 
* All database interactions are managed by Drizzle ORM, which compiles queries into parameterized statements. This ensures user input is treated strictly as data parameters rather than executable SQL commands.

### Cross-Site Scripting (XSS) Protection
* Payloads are validated against strict TypeScript schemas using Zod.
* User-provided markdown text descriptions are sanitized on render using `DOMPurify` to block scripts and malicious link patterns.
* File uploads are parsed for MIME types. File downloads use safety headers (`Content-Type`, `Content-Disposition: attachment`) to force downloads to save directly to disk instead of executing within the user's browser session.

### Immutable Audit Trail
* The `audit_logs` table stores records of system actions (e.g. `RISK_DELETE`, `USER_CLAIM`).
* The API lacks CRUD endpoints to update or delete records in this table.
* Audit logs are append-only. This provides an audit trail that cannot be manipulated by users or managers.

### Cross-Origin Request Blocking (CORS)
* The Hono API includes CORS checking to ensure it only processes requests originating from verified domains, blocking unauthorized cross-origin attempts.
