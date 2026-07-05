# GRC Platform Security Architecture

The platform incorporates secure-by-design mechanisms aligned with OWASP ASVS guidelines to safeguard sensitive corporate GRC data.

---

## 1. Authentication & Token Verification
* **JWKS Certificates Validation**: Decodes JWT headers and queries Google's public JWKS endpoint to verify token integrity. This prevents token-tampering and key spoofing attacks.
* **Stateless Edge Sessions**: Hono edge runtime processes validation entirely in-memory at the network edge, avoiding session cookies or server-side state lookup bottlenecks.

---

## 2. Authorization (RBAC Permission Matrix)

The API middleware intercepts endpoints and checks D1 user roles to enforce access control:

| Role | Read Register | Create / Edit Risks | Provision Users | Delete Organization | View Audit Logs |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CISO** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Risk Manager** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Auditor** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Risk Owner** | ✅ | ✅ (Assigned) | ❌ | ❌ | ❌ |
| **Asset Owner** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Threat Mitigation Controls

* **SQL Injection Prevention**: The application exclusively queries the SQLite database through Drizzle ORM which compiles queries into parameterized statements. No raw string interpolations are performed.
* **XSS Protection & Sanitization**: Strict input schemas validated via Zod ensure payloads conform to exact structures. File downloads utilize headers (`Content-Disposition: attachment`, `Content-Type`) preventing malicious HTML files from executing scripts in user contexts.
* **Immutable Audit Trail**: The `audit_logs` table has no corresponding update/delete APIs, meaning records are append-only.
* **Rate Limiting**: Custom edge middleware intercepts brute-force vectors and limits API calls per IP to mitigate Denial of Service (DoS) and automated scanning tools.
